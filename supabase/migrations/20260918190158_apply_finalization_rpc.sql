-- Makes successful Kernor Apply finalization atomic. Previously, a
-- confirmed employer submission was followed by several separate
-- update/insert statements from the application layer (applications
-- upsert, credit_transactions insert, job_opportunities update,
-- application_runs update) with no transaction wrapping them together —
-- a failure partway through (network drop, function timeout, process
-- crash) could leave the credit debited without the application record
-- updated, or vice versa. This function performs the entire finalization
-- as one atomic transaction.
--
-- It relies on triggers already present from the baseline migration to
-- do their normal work as a side effect of the writes below:
--   - kernor_private.freeze_application_context() (BEFORE INSERT/UPDATE OF
--     job_id, tailored_resume_id ON applications) freezes the job/resume
--     snapshot onto the application row.
--   - kernor_private.log_application_status_event() (AFTER INSERT/UPDATE
--     OF status ON applications) writes the application_status_events
--     timeline entry.
--   - kernor_private.apply_credit_transaction() (AFTER INSERT ON
--     credit_transactions) atomically updates credit_balances and the
--     private credit_ledger, with its own row lock and insufficient-
--     credit guard.
-- No credit-affecting logic is duplicated here; it is delegated to the
-- same trigger the rest of the app already relies on.

CREATE OR REPLACE FUNCTION public.kernor_finalize_successful_application (
  p_run_id           uuid,
  p_user_id          uuid,
  p_confirmation_text text,
  p_page_url         text DEFAULT NULL
)
  RETURNS TABLE (
    application_id    uuid,
    run_id            uuid,
    already_finalized boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'kernor_private', 'pg_temp'
  AS $function$
declare
  v_run public.application_runs%rowtype;
  v_job public.job_opportunities%rowtype;
  v_application_id uuid;
  v_now timestamptz := now();
begin
  select *
  into v_run
  from public.application_runs
  where id = p_run_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'application run not found';
  end if;

  -- Idempotent replay: this run was already fully finalized (by an
  -- earlier attempt, or a retry that landed after a crash but whose
  -- response never reached the caller). Do not re-charge or re-mutate
  -- anything — just report what already happened.
  if v_run.status = 'submitted' then
    select id
    into v_application_id
    from public.applications
    where user_id = p_user_id
      and job_id = v_run.job_id
    limit 1;

    return query select v_application_id, v_run.id, true;
    return;
  end if;

  -- A run that has already been marked failed or cancelled must never be
  -- finalized into a charged, "submitted" application after the fact.
  if v_run.status in ('failed', 'cancelled') then
    raise exception 'application run cannot be finalized from status %', v_run.status;
  end if;

  if p_confirmation_text is null or length(trim(p_confirmation_text)) = 0 then
    raise exception 'a confirmed submission message is required to finalize';
  end if;

  select *
  into v_job
  from public.job_opportunities
  where id = v_run.job_id;

  select id
  into v_application_id
  from public.applications
  where user_id = p_user_id
    and job_id = v_run.job_id
  limit 1;

  if v_application_id is not null then
    update public.applications
    set tailored_resume_id = v_run.approved_resume_id,
        application_url = v_run.target_url,
        status = 'applied',
        submission_confirmation = p_confirmation_text,
        submitted_at = v_now,
        last_event_at = v_now,
        updated_at = v_now
    where id = v_application_id;
  else
    insert into public.applications (
      user_id, job_id, tailored_resume_id, company_name, role_title,
      application_url, status, submission_confirmation, submitted_at, last_event_at
    )
    values (
      p_user_id,
      v_run.job_id,
      v_run.approved_resume_id,
      coalesce(v_job.company_name, 'Company'),
      coalesce(v_job.role_title, 'Role'),
      v_run.target_url,
      'applied',
      p_confirmation_text,
      v_now,
      v_now
    )
    returning id into v_application_id;
  end if;

  -- Exactly one application-credit debit per run, enforced by the unique
  -- constraint on credit_transactions.external_reference: a retried call
  -- for the same run_id collides here and is silently skipped rather than
  -- charging twice. If the balance is insufficient, apply_credit_transaction()
  -- raises and this entire transaction rolls back — including the
  -- application upsert above — so no half-updated state is left behind.
  insert into public.credit_transactions (
    user_id, credit_type, delta, reason, external_reference, metadata
  )
  values (
    p_user_id,
    'application',
    -1,
    'successful_application',
    'application:' || p_run_id::text,
    jsonb_build_object('application_run_id', p_run_id, 'job_id', v_run.job_id)
  )
  on conflict (external_reference) do nothing;

  update public.job_opportunities
  set status = 'applied',
      updated_at = v_now
  where id = v_run.job_id;

  update public.application_runs
  set status = 'submitted',
      stop_reason = null,
      submission_confirmation = p_confirmation_text,
      submission_evidence = jsonb_build_object(
        'after_url', p_page_url,
        'confirmation_detected', true,
        'confirmation_text', p_confirmation_text
      ),
      current_url = coalesce(p_page_url, v_run.current_url),
      submitted_at = v_now,
      finished_at = v_now,
      resume_token = null,
      updated_at = v_now
  where id = p_run_id;

  return query select v_application_id, p_run_id, false;
end;
$function$;

REVOKE ALL ON FUNCTION public.kernor_finalize_successful_application(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kernor_finalize_successful_application(uuid, uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.kernor_finalize_successful_application(uuid, uuid, text, text) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.kernor_finalize_successful_application(uuid, uuid, text, text) TO postgres, service_role;
