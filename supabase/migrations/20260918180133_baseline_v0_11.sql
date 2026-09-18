SET local check_function_bodies = off;

CREATE SCHEMA "kernor_private";

CREATE TABLE "kernor_private"."billing_customers" (
  "user_id"            uuid                     NOT NULL,
  "stripe_customer_id" text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_customers_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "billing_customers_stripe_customer_id_key" UNIQUE (stripe_customer_id)
);

ALTER TABLE "kernor_private"."billing_customers"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "kernor_private"."credit_ledger" (
  "id"                 bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "user_id"            uuid                     NOT NULL,
  "credit_type"        text                     NOT NULL,
  "delta"              integer                  NOT NULL,
  "reason"             text                     NOT NULL,
  "external_reference" text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "credit_ledger_credit_type_check" CHECK ((credit_type = ANY (ARRAY['application'::text, 'interview'::text]))),
  CONSTRAINT "credit_ledger_delta_check" CHECK ((delta <> 0)),
  CONSTRAINT "credit_ledger_pkey" PRIMARY KEY (id)
);

ALTER TABLE "kernor_private"."credit_ledger"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."application_answer_vault" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid                     NOT NULL,
  "answer_key"       text                     NOT NULL,
  "label"            text                     NOT NULL,
  "category"         text                     NOT NULL,
  "answer_text"      text                     NOT NULL,
  "auto_use_allowed" boolean                  NOT NULL DEFAULT false,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "application_answer_vault_category_check"
    CHECK
    ((category = ANY (ARRAY['work_authorization'::text, 'sponsorship'::text, 'relocation'::text, 'salary'::text, 'start_date'::text, 'work_arrangement'::text, 'clearance'::text,
    'contact'::text, 'portfolio'::text, 'custom'::text]))),
  CONSTRAINT "application_answer_vault_pkey" PRIMARY KEY (id),
  CONSTRAINT "application_answer_vault_user_id_answer_key_key" UNIQUE (user_id, answer_key)
);

ALTER TABLE "public"."application_answer_vault"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."application_run_events" (
  "id"         bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "run_id"     uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "event_type" text                     NOT NULL,
  "summary"    text                     NOT NULL,
  "metadata"   jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "application_run_events_event_type_check"
    CHECK
    ((event_type = ANY (ARRAY['created'::text, 'preflight'::text, 'browser_started'::text, 'navigated'::text, 'field_filled'::text, 'resume_uploaded'::text,
    'question_resolved'::text, 'paused'::text, 'ready_to_submit'::text, 'submitted'::text, 'failed'::text, 'cancelled'::text, 'credit_consumed'::text]))),
  CONSTRAINT "application_run_events_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."application_run_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."application_run_questions" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "run_id"             uuid                     NOT NULL,
  "user_id"            uuid                     NOT NULL,
  "field_key"          text,
  "question_text"      text                     NOT NULL,
  "category"           text                     NOT NULL DEFAULT 'custom'::text,
  "answer_text"        text,
  "answer_source"      text,
  "status"             text                     NOT NULL DEFAULT 'needs_user'::text,
  "auto_reuse_allowed" boolean                  NOT NULL DEFAULT false,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at"        timestamp with time zone,
  CONSTRAINT "application_run_questions_answer_source_check"
    CHECK (((answer_source IS NULL) OR (answer_source = ANY (ARRAY['vault'::text, 'profile'::text, 'generated'::text, 'user'::text])))),
  CONSTRAINT "application_run_questions_category_check"
    CHECK
    ((category = ANY (ARRAY['work_authorization'::text, 'sponsorship'::text, 'relocation'::text, 'salary'::text, 'start_date'::text, 'work_arrangement'::text, 'clearance'::text,
    'contact'::text, 'portfolio'::text, 'custom'::text, 'sensitive'::text]))),
  CONSTRAINT "application_run_questions_pkey" PRIMARY KEY (id),
  CONSTRAINT "application_run_questions_status_check" CHECK ((status = ANY (ARRAY['needs_user'::text, 'resolved'::text, 'skipped'::text])))
);

ALTER TABLE "public"."application_run_questions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."application_runs" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                 uuid                     NOT NULL,
  "job_id"                  uuid                     NOT NULL,
  "approved_resume_id"      uuid                     NOT NULL,
  "target_url"              text                     NOT NULL,
  "execution_mode"          text                     NOT NULL DEFAULT 'assisted'::text,
  "status"                  text                     NOT NULL DEFAULT 'queued'::text,
  "browser_provider"        text,
  "browser_session_id"      text,
  "live_view_url"           text,
  "current_url"             text,
  "stop_reason"             text,
  "submission_confirmation" text,
  "submission_evidence"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "started_at"              timestamp with time zone,
  "submitted_at"            timestamp with time zone,
  "finished_at"             timestamp with time zone,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "workflow_run_id"         text,
  "resume_token"            text,
  CONSTRAINT "application_runs_execution_mode_check" CHECK ((execution_mode = 'assisted'::text)),
  CONSTRAINT "application_runs_pkey" PRIMARY KEY (id),
  CONSTRAINT "application_runs_status_check"
    CHECK
    ((status = ANY (ARRAY['queued'::text, 'preflight'::text, 'running'::text, 'needs_user'::text, 'ready_to_submit'::text, 'submitting'::text, 'submitted'::text, 'failed'::text,
    'cancelled'::text])))
);

ALTER TABLE "public"."application_runs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."application_status_events" (
  "id"             bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "application_id" uuid                     NOT NULL,
  "user_id"        uuid                     NOT NULL,
  "event_type"     text                     NOT NULL,
  "from_status"    text,
  "to_status"      text,
  "title"          text                     NOT NULL,
  "detail"         text,
  "source"         text                     NOT NULL DEFAULT 'system'::text,
  "metadata"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "application_status_events_event_type_check"
    CHECK
    ((event_type = ANY (ARRAY['created'::text, 'status_change'::text, 'submission_confirmed'::text, 'resume_frozen'::text, 'email_detected'::text, 'calendar_detected'::text,
    'interview_created'::text, 'note'::text]))),
  CONSTRAINT "application_status_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "application_status_events_source_check" CHECK ((source = ANY (ARRAY['system'::text, 'user'::text, 'email'::text, 'calendar'::text])))
);

ALTER TABLE "public"."application_status_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."applications" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                 uuid                     NOT NULL,
  "job_id"                  uuid,
  "tailored_resume_id"      uuid,
  "company_name"            text                     NOT NULL,
  "role_title"              text                     NOT NULL,
  "application_url"         text,
  "status"                  text                     NOT NULL DEFAULT 'approved'::text,
  "submission_confirmation" text,
  "submitted_at"            timestamp with time zone,
  "last_event_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "match_score_snapshot"    smallint,
  "job_snapshot"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "resume_snapshot"         jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT "applications_match_score_snapshot_check" CHECK (((match_score_snapshot IS NULL) OR ((match_score_snapshot >= 0) AND (match_score_snapshot <= 100)))),
  CONSTRAINT "applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "applications_status_check"
    CHECK
    ((status = ANY (ARRAY['approved'::text, 'applying'::text, 'applied'::text, 'employer_response'::text, 'assessment'::text, 'interview'::text, 'rejected'::text,
    'withdrawn'::text, 'offer'::text, 'accepted'::text])))
);

ALTER TABLE "public"."applications"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."billing_events" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "stripe_event_id"     text                     NOT NULL,
  "checkout_session_id" text,
  "user_id"             uuid                     NOT NULL,
  "credit_type"         text                     NOT NULL,
  "credit_delta"        integer                  NOT NULL,
  "sku"                 text                     NOT NULL,
  "amount_cents"        integer                  NOT NULL,
  "currency"            text                     NOT NULL DEFAULT 'usd'::text,
  "stripe_customer_id"  text,
  "metadata"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "billing_events_amount_cents_check" CHECK ((amount_cents >= 0)),
  CONSTRAINT "billing_events_checkout_session_id_key" UNIQUE (checkout_session_id),
  CONSTRAINT "billing_events_credit_delta_check" CHECK ((credit_delta > 0)),
  CONSTRAINT "billing_events_credit_type_check" CHECK ((credit_type = ANY (ARRAY['application'::text, 'interview'::text]))),
  CONSTRAINT "billing_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "billing_events_stripe_event_id_key" UNIQUE (stripe_event_id)
);

ALTER TABLE "public"."billing_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."credit_balances" (
  "user_id"             uuid                     NOT NULL,
  "application_credits" integer                  NOT NULL DEFAULT 0,
  "interview_passes"    integer                  NOT NULL DEFAULT 0,
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "credit_balances_application_credits_check" CHECK ((application_credits >= 0)),
  CONSTRAINT "credit_balances_interview_passes_check" CHECK ((interview_passes >= 0)),
  CONSTRAINT "credit_balances_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."credit_balances"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."credit_transactions" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"            uuid                     NOT NULL,
  "credit_type"        text                     NOT NULL,
  "delta"              integer                  NOT NULL,
  "reason"             text                     NOT NULL,
  "external_reference" text,
  "amount_cents"       integer,
  "metadata"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "credit_transactions_amount_cents_check" CHECK (((amount_cents IS NULL) OR (amount_cents >= 0))),
  CONSTRAINT "credit_transactions_credit_type_check" CHECK ((credit_type = ANY (ARRAY['application'::text, 'interview'::text]))),
  CONSTRAINT "credit_transactions_delta_check" CHECK ((delta <> 0)),
  CONSTRAINT "credit_transactions_external_reference_key" UNIQUE (external_reference),
  CONSTRAINT "credit_transactions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."credit_transactions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."external_signals" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                uuid                     NOT NULL,
  "application_id"         uuid,
  "source"                 text                     NOT NULL,
  "external_id"            text                     NOT NULL,
  "signal_type"            text                     NOT NULL,
  "title"                  text,
  "sender"                 text,
  "occurred_at"            timestamp with time zone,
  "payload"                jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "processed_at"           timestamp with time zone,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "integration_account_id" uuid,
  CONSTRAINT "external_signals_pkey" PRIMARY KEY (id),
  CONSTRAINT "external_signals_signal_type_check"
    CHECK
    ((signal_type = ANY (ARRAY['employer_response'::text, 'assessment'::text, 'interview_invite'::text, 'interview_update'::text, 'rejection'::text, 'offer'::text,
    'unknown'::text]))),
  CONSTRAINT "external_signals_source_check" CHECK ((source = ANY (ARRAY['email'::text, 'calendar'::text]))),
  CONSTRAINT "external_signals_user_id_source_external_id_key" UNIQUE (user_id, source, external_id)
);

ALTER TABLE "public"."external_signals"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."follow_up_drafts" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "interview_id"    uuid                     NOT NULL,
  "application_id"  uuid                     NOT NULL,
  "user_id"         uuid                     NOT NULL,
  "analysis_id"     uuid,
  "recipient_email" text,
  "recipient_name"  text,
  "subject"         text                     NOT NULL,
  "body"            text                     NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'draft'::text,
  "send_provider"   text,
  "sent_at"         timestamp with time zone,
  "last_error"      text,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "follow_up_drafts_pkey" PRIMARY KEY (id),
  CONSTRAINT "follow_up_drafts_send_provider_check"
    CHECK (((send_provider IS NULL) OR (send_provider = ANY (ARRAY['google'::text, 'microsoft'::text, 'smtp'::text, 'mailto'::text])))),
  CONSTRAINT "follow_up_drafts_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'approved'::text, 'sent'::text, 'failed'::text])))
);

ALTER TABLE "public"."follow_up_drafts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."integration_accounts" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "service_type"    text                     NOT NULL,
  "provider"        text                     NOT NULL,
  "account_email"   text,
  "auth_method"     text                     NOT NULL,
  "connector_id"    text,
  "vault_secret_id" uuid,
  "imap_host"       text,
  "imap_port"       integer,
  "status"          text                     NOT NULL DEFAULT 'disconnected'::text,
  "last_sync_at"    timestamp with time zone,
  "last_error"      text,
  "connected_at"    timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "integration_accounts_auth_method_check" CHECK ((auth_method = ANY (ARRAY['oauth'::text, 'imap_secret'::text]))),
  CONSTRAINT "integration_accounts_pkey" PRIMARY KEY (id),
  CONSTRAINT "integration_accounts_provider_check" CHECK ((provider = ANY (ARRAY['google'::text, 'microsoft'::text, 'yahoo'::text, 'icloud'::text, 'imap'::text]))),
  CONSTRAINT "integration_accounts_service_type_check" CHECK ((service_type = ANY (ARRAY['email'::text, 'calendar'::text]))),
  CONSTRAINT "integration_accounts_status_check" CHECK ((status = ANY (ARRAY['disconnected'::text, 'connecting'::text, 'connected'::text, 'error'::text]))),
  CONSTRAINT "integration_accounts_user_id_service_type_provider_account__key" UNIQUE (user_id, service_type, PROVIDER, account_email)
);

ALTER TABLE "public"."integration_accounts"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."integration_connections" (
  "user_id"      uuid                     NOT NULL,
  "provider"     text                     NOT NULL,
  "status"       text                     NOT NULL DEFAULT 'disconnected'::text,
  "connector_id" text,
  "last_sync_at" timestamp with time zone,
  "last_error"   text,
  "connected_at" timestamp with time zone,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "integration_connections_pkey" PRIMARY KEY (user_id, PROVIDER),
  CONSTRAINT "integration_connections_provider_check" CHECK ((provider = 'google'::text)),
  CONSTRAINT "integration_connections_status_check" CHECK ((status = ANY (ARRAY['disconnected'::text, 'connecting'::text, 'connected'::text, 'error'::text])))
);

ALTER TABLE "public"."integration_connections"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."interview_readiness" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "interview_id"   uuid                     NOT NULL,
  "user_id"        uuid                     NOT NULL,
  "version_number" integer                  NOT NULL,
  "briefing"       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "interview_readiness_interview_id_version_number_key" UNIQUE (interview_id, version_number),
  CONSTRAINT "interview_readiness_pkey" PRIMARY KEY (id),
  CONSTRAINT "interview_readiness_version_number_check" CHECK ((version_number > 0))
);

ALTER TABLE "public"."interview_readiness"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."interview_round_memory" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "interview_id"        uuid                     NOT NULL,
  "application_id"      uuid                     NOT NULL,
  "user_id"             uuid                     NOT NULL,
  "round_number"        integer                  NOT NULL,
  "questions_asked"     text[]                   NOT NULL DEFAULT '{}'::text[],
  "topics_discussed"    text[]                   NOT NULL DEFAULT '{}'::text[],
  "experiences_used"    text[]                   NOT NULL DEFAULT '{}'::text[],
  "interviewer_signals" text[]                   NOT NULL DEFAULT '{}'::text[],
  "commitments"         text[]                   NOT NULL DEFAULT '{}'::text[],
  "candidate_notes"     text,
  "handoff_summary"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "source"              text                     NOT NULL DEFAULT 'user'::text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "interview_round_memory_interview_id_key" UNIQUE (interview_id),
  CONSTRAINT "interview_round_memory_pkey" PRIMARY KEY (id),
  CONSTRAINT "interview_round_memory_round_number_check" CHECK ((round_number > 0)),
  CONSTRAINT "interview_round_memory_source_check" CHECK ((source = ANY (ARRAY['user'::text, 'live'::text])))
);

ALTER TABLE "public"."interview_round_memory"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."interviews" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                 uuid                     NOT NULL,
  "application_id"          uuid                     NOT NULL,
  "stage"                   text,
  "scheduled_at"            timestamp with time zone,
  "timezone"                text,
  "meeting_provider"        text,
  "meeting_url"             text,
  "interviewer_details"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "status"                  text                     NOT NULL DEFAULT 'scheduled'::text,
  "interview_type"          text,
  "response_style"          text,
  "response_length"         text,
  "live_pass_status"        text                     NOT NULL DEFAULT 'not_purchased'::text,
  "started_at"              timestamp with time zone,
  "ended_at"                timestamp with time zone,
  "transcript_storage_path" text,
  "post_analysis"           jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"              timestamp with time zone NOT NULL DEFAULT now(),
  "source"                  text,
  "source_external_id"      text,
  "source_signal_id"        uuid,
  "duration_minutes"        integer,
  "round_number"            integer,
  "readiness_generated_at"  timestamp with time zone,
  CONSTRAINT "interviews_duration_minutes_check" CHECK (((duration_minutes IS NULL) OR ((duration_minutes >= 5) AND (duration_minutes <= 480)))),
  CONSTRAINT "interviews_live_pass_status_check"
    CHECK ((live_pass_status = ANY (ARRAY['not_purchased'::text, 'available'::text, 'activated'::text, 'consumed'::text, 'refunded'::text]))),
  CONSTRAINT "interviews_pkey" PRIMARY KEY (id),
  CONSTRAINT "interviews_round_number_check" CHECK (((round_number IS NULL) OR (round_number > 0))),
  CONSTRAINT "interviews_source_check" CHECK (((source IS NULL) OR (source = ANY (ARRAY['email'::text, 'calendar'::text, 'manual'::text])))),
  CONSTRAINT "interviews_status_check"
    CHECK ((status = ANY (ARRAY['invited'::text, 'scheduled'::text, 'ready'::text, 'live'::text, 'completed'::text, 'cancelled'::text, 'rescheduled'::text])))
);

ALTER TABLE "public"."interviews"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_opportunities" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid                     NOT NULL,
  "external_id"      text,
  "source"           text,
  "source_url"       text,
  "company_name"     text                     NOT NULL,
  "role_title"       text                     NOT NULL,
  "location"         text,
  "work_arrangement" text,
  "employment_type"  text,
  "salary_text"      text,
  "description"      text,
  "match_score"      smallint,
  "match_breakdown"  jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "status"           text                     NOT NULL DEFAULT 'discovered'::text,
  "discovered_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "job_opportunities_match_score_check" CHECK (((match_score IS NULL) OR ((match_score >= 0) AND (match_score <= 100)))),
  CONSTRAINT "job_opportunities_pkey" PRIMARY KEY (id),
  CONSTRAINT "job_opportunities_status_check"
    CHECK ((status = ANY (ARRAY['discovered'::text, 'reviewing'::text, 'saved'::text, 'rejected'::text, 'approved'::text, 'applied'::text, 'closed'::text])))
);

ALTER TABLE "public"."job_opportunities"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."job_preferences" (
  "user_id"            uuid                     NOT NULL,
  "min_match_score"    smallint                 NOT NULL DEFAULT 85,
  "target_titles"      text[]                   NOT NULL DEFAULT '{}'::text[],
  "target_locations"   text[]                   NOT NULL DEFAULT '{}'::text[],
  "employment_types"   text[]                   NOT NULL DEFAULT '{}'::text[],
  "industries"         text[]                   NOT NULL DEFAULT '{}'::text[],
  "remote_only"        boolean                  NOT NULL DEFAULT false,
  "minimum_salary"     integer,
  "work_authorization" text,
  "sponsorship_needed" boolean,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "job_preferences_min_match_score_check" CHECK (((min_match_score >= 0) AND (min_match_score <= 100))),
  CONSTRAINT "job_preferences_minimum_salary_check" CHECK (((minimum_salary IS NULL) OR (minimum_salary >= 0))),
  CONSTRAINT "job_preferences_pkey" PRIMARY KEY (user_id)
);

ALTER TABLE "public"."job_preferences"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."live_guidance" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"         uuid                     NOT NULL,
  "transcript_item_id" bigint,
  "user_id"            uuid                     NOT NULL,
  "mode"               text                     NOT NULL DEFAULT 'default'::text,
  "question_text"      text                     NOT NULL,
  "response_text"      text                     NOT NULL,
  "structure"          text,
  "verified_evidence"  text[]                   NOT NULL DEFAULT '{}'::text[],
  "caution"            text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "live_guidance_mode_check" CHECK ((mode = ANY (ARRAY['default'::text, 'star'::text, 'shorter'::text, 'technical'::text, 'follow_up'::text, 'manual'::text]))),
  CONSTRAINT "live_guidance_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."live_guidance"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."live_interview_sessions" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "interview_id"        uuid                     NOT NULL,
  "application_id"      uuid                     NOT NULL,
  "user_id"             uuid                     NOT NULL,
  "status"              text                     NOT NULL DEFAULT 'prepared'::text,
  "capture_mode"        text                     NOT NULL DEFAULT 'microphone'::text,
  "transcription_model" text                     NOT NULL DEFAULT 'gpt-live-transcribe'::text,
  "guidance_model"      text                     NOT NULL DEFAULT 'gpt-5.6-luna'::text,
  "openai_session_id"   text,
  "consented_at"        timestamp with time zone,
  "activated_at"        timestamp with time zone,
  "ended_at"            timestamp with time zone,
  "last_transcript_at"  timestamp with time zone,
  "context_snapshot"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "error_message"       text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "live_interview_sessions_capture_mode_check" CHECK ((capture_mode = ANY (ARRAY['microphone'::text, 'shared_audio'::text, 'mixed'::text]))),
  CONSTRAINT "live_interview_sessions_interview_id_key" UNIQUE (interview_id),
  CONSTRAINT "live_interview_sessions_pkey" PRIMARY KEY (id),
  CONSTRAINT "live_interview_sessions_status_check" CHECK ((status = ANY (ARRAY['prepared'::text, 'active'::text, 'ended'::text, 'failed'::text])))
);

ALTER TABLE "public"."live_interview_sessions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."live_transcript_items" (
  "id"               bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "session_id"       uuid                     NOT NULL,
  "user_id"          uuid                     NOT NULL,
  "realtime_item_id" text                     NOT NULL,
  "transcript"       text                     NOT NULL,
  "is_question"      boolean                  NOT NULL DEFAULT false,
  "question_text"    text,
  "occurred_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "live_transcript_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "live_transcript_items_session_id_realtime_item_id_key" UNIQUE (session_id, realtime_item_id)
);

ALTER TABLE "public"."live_transcript_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."post_interview_analyses" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "interview_id"          uuid                     NOT NULL,
  "application_id"        uuid                     NOT NULL,
  "user_id"               uuid                     NOT NULL,
  "version_number"        integer                  NOT NULL,
  "analysis"              jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "transcript_item_count" integer                  NOT NULL DEFAULT 0,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "post_interview_analyses_interview_id_version_number_key" UNIQUE (interview_id, version_number),
  CONSTRAINT "post_interview_analyses_pkey" PRIMARY KEY (id),
  CONSTRAINT "post_interview_analyses_transcript_item_count_check" CHECK ((transcript_item_count >= 0)),
  CONSTRAINT "post_interview_analyses_version_number_check" CHECK ((version_number > 0))
);

ALTER TABLE "public"."post_interview_analyses"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"                   uuid                     NOT NULL,
  "full_name"            text,
  "headline"             text,
  "location"             text,
  "work_preference"      text,
  "linkedin_url"         text,
  "github_url"           text,
  "portfolio_url"        text,
  "skills"               text[]                   NOT NULL DEFAULT '{}'::text[],
  "certifications"       text[]                   NOT NULL DEFAULT '{}'::text[],
  "candidate_facts"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "onboarding_completed" boolean                  NOT NULL DEFAULT false,
  "created_at"           timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_work_preference_check"
    CHECK (((work_preference IS NULL) OR (work_preference = ANY (ARRAY['remote'::text, 'hybrid'::text, 'onsite'::text, 'flexible'::text]))))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."resume_tailorings" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"            uuid                     NOT NULL,
  "job_id"             uuid                     NOT NULL,
  "source_resume_id"   uuid                     NOT NULL,
  "version_number"     integer                  NOT NULL,
  "status"             text                     NOT NULL DEFAULT 'draft'::text,
  "tailored_resume"    jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "changes"            jsonb                    NOT NULL DEFAULT '[]'::jsonb,
  "improvement_count"  integer                  NOT NULL DEFAULT 0,
  "approved_at"        timestamp with time zone,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "approved_resume_id" uuid,
  CONSTRAINT "resume_tailorings_improvement_count_check" CHECK ((improvement_count >= 0)),
  CONSTRAINT "resume_tailorings_job_id_version_number_key" UNIQUE (job_id, version_number),
  CONSTRAINT "resume_tailorings_pkey" PRIMARY KEY (id),
  CONSTRAINT "resume_tailorings_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'approved'::text, 'rejected'::text]))),
  CONSTRAINT "resume_tailorings_version_number_check" CHECK ((version_number > 0))
);

ALTER TABLE "public"."resume_tailorings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."resumes" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "file_name"    text                     NOT NULL,
  "storage_path" text,
  "mime_type"    text,
  "size_bytes"   bigint,
  "is_master"    boolean                  NOT NULL DEFAULT false,
  "is_approved"  boolean                  NOT NULL DEFAULT false,
  "parsed_data"  jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "resumes_pkey" PRIMARY KEY (id),
  CONSTRAINT "resumes_size_bytes_check" CHECK (((size_bytes IS NULL) OR (size_bytes >= 0)))
);

ALTER TABLE "public"."resumes"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION kernor_private.apply_credit_transaction()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'kernor_private', 'pg_temp'
  AS $function$
declare
  current_app integer;
  current_interview integer;
begin
  insert into public.credit_balances (user_id, application_credits, interview_passes, updated_at)
  values (new.user_id, 0, 0, now())
  on conflict (user_id) do nothing;

  select application_credits, interview_passes
  into current_app, current_interview
  from public.credit_balances
  where user_id = new.user_id
  for update;

  if new.credit_type = 'application' then
    if current_app + new.delta < 0 then
      raise exception 'insufficient application credits';
    end if;

    update public.credit_balances
    set application_credits = application_credits + new.delta,
        updated_at = now()
    where user_id = new.user_id;
  else
    if current_interview + new.delta < 0 then
      raise exception 'insufficient interview passes';
    end if;

    update public.credit_balances
    set interview_passes = interview_passes + new.delta,
        updated_at = now()
    where user_id = new.user_id;
  end if;

  insert into kernor_private.credit_ledger
    (user_id, credit_type, delta, reason, external_reference)
  values
    (new.user_id, new.credit_type, new.delta, new.reason, new.external_reference);

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION kernor_private.freeze_application_context()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'kernor_private', 'pg_temp'
  AS $function$
declare
  job_row public.job_opportunities%rowtype;
  resume_row public.resumes%rowtype;
begin
  if new.job_id is not null then
    select * into job_row
    from public.job_opportunities
    where id = new.job_id;

    if found then
      if new.match_score_snapshot is null then
        new.match_score_snapshot := job_row.match_score;
      end if;

      if new.job_snapshot = '{}'::jsonb then
        new.job_snapshot := jsonb_build_object(
          'company_name', job_row.company_name,
          'role_title', job_row.role_title,
          'location', job_row.location,
          'work_arrangement', job_row.work_arrangement,
          'employment_type', job_row.employment_type,
          'salary_text', job_row.salary_text,
          'description', job_row.description,
          'match_score', job_row.match_score,
          'match_breakdown', job_row.match_breakdown,
          'source', job_row.source,
          'source_url', job_row.source_url
        );
      end if;
    end if;
  end if;

  if new.tailored_resume_id is not null and new.resume_snapshot = '{}'::jsonb then
    select * into resume_row
    from public.resumes
    where id = new.tailored_resume_id;

    if found then
      new.resume_snapshot := jsonb_build_object(
        'resume_id', resume_row.id,
        'file_name', resume_row.file_name,
        'storage_path', resume_row.storage_path,
        'mime_type', resume_row.mime_type,
        'parsed_data', resume_row.parsed_data,
        'approved', resume_row.is_approved
      );
    end if;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION kernor_private.fulfill_billing_event()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'kernor_private', 'pg_temp'
  AS $function$
begin
  insert into public.credit_transactions
    (user_id, credit_type, delta, reason, external_reference, amount_cents, metadata)
  values
    (
      new.user_id,
      new.credit_type,
      new.credit_delta,
      'stripe_purchase',
      new.stripe_event_id,
      new.amount_cents,
      jsonb_build_object(
        'sku', new.sku,
        'checkout_session_id', new.checkout_session_id,
        'currency', new.currency,
        'stripe_customer_id', new.stripe_customer_id
      ) || new.metadata
    );

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION kernor_private.log_application_status_event()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public', 'kernor_private', 'pg_temp'
  AS $function$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_events (
      application_id, user_id, event_type, to_status, title, detail, source, metadata
    ) values (
      new.id,
      new.user_id,
      'created',
      new.status,
      'Application added',
      case
        when new.submitted_at is not null then 'Kernor is now tracking this application.'
        else 'Application tracking started.'
      end,
      'system',
      jsonb_build_object(
        'company_name', new.company_name,
        'role_title', new.role_title
      )
    );

    if new.tailored_resume_id is not null then
      insert into public.application_status_events (
        application_id, user_id, event_type, to_status, title, detail, source, metadata
      ) values (
        new.id,
        new.user_id,
        'resume_frozen',
        new.status,
        'Resume version frozen',
        'The exact approved resume used for this application is attached to the record.',
        'system',
        jsonb_build_object('resume_id', new.tailored_resume_id)
      );
    end if;

    if new.submitted_at is not null then
      insert into public.application_status_events (
        application_id, user_id, event_type, to_status, title, detail, source, metadata
      ) values (
        new.id,
        new.user_id,
        'submission_confirmed',
        new.status,
        'Application submitted',
        coalesce(new.submission_confirmation, 'Employer submission confirmed.'),
        'system',
        jsonb_build_object('submitted_at', new.submitted_at)
      );
    end if;
  elsif old.status is distinct from new.status then
    insert into public.application_status_events (
      application_id, user_id, event_type, from_status, to_status, title, detail, source
    ) values (
      new.id,
      new.user_id,
      'status_change',
      old.status,
      new.status,
      'Status changed',
      'Application moved from ' || replace(old.status, '_', ' ') ||
        ' to ' || replace(new.status, '_', ' ') || '.',
      'system'
    );
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.kernor_activate_live_session (
  p_session_id        uuid,
  p_user_id           uuid,
  p_openai_session_id text
)
  RETURNS public.live_interview_sessions
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'kernor_private', 'pg_temp'
  AS $function$
declare
  v_session public.live_interview_sessions%rowtype;
  v_now timestamptz := now();
begin
  select *
  into v_session
  from public.live_interview_sessions
  where id = p_session_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'live session not found';
  end if;

  if v_session.status = 'active' then
    return v_session;
  end if;

  if v_session.status not in ('prepared','failed') then
    raise exception 'live session cannot be activated from status %', v_session.status;
  end if;

  insert into public.credit_transactions (
    user_id,
    credit_type,
    delta,
    reason,
    external_reference,
    metadata
  )
  values (
    p_user_id,
    'interview',
    -1,
    'live_interview_started',
    'live:' || p_session_id::text,
    jsonb_build_object(
      'live_session_id', p_session_id,
      'interview_id', v_session.interview_id
    )
  )
  on conflict (external_reference) do nothing;

  update public.live_interview_sessions
  set status = 'active',
      openai_session_id = p_openai_session_id,
      activated_at = coalesce(activated_at, v_now),
      error_message = null,
      updated_at = v_now
  where id = p_session_id
  returning * into v_session;

  update public.interviews
  set status = 'live',
      live_pass_status = 'consumed',
      started_at = coalesce(started_at, v_now),
      updated_at = v_now
  where id = v_session.interview_id
    and user_id = p_user_id;

  return v_session;
end;
$function$;

CREATE OR REPLACE FUNCTION public.kernor_end_live_session (
  p_session_id uuid,
  p_user_id    uuid
)
  RETURNS public.live_interview_sessions
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
declare
  v_session public.live_interview_sessions%rowtype;
  v_now timestamptz := now();
begin
  update public.live_interview_sessions
  set status = 'ended',
      ended_at = coalesce(ended_at, v_now),
      updated_at = v_now
  where id = p_session_id
    and user_id = p_user_id
    and status in ('active','prepared','failed')
  returning * into v_session;

  if not found then
    select *
    into v_session
    from public.live_interview_sessions
    where id = p_session_id
      and user_id = p_user_id;

    if not found then
      raise exception 'live session not found';
    end if;
  end if;

  update public.interviews
  set status = 'completed',
      ended_at = coalesce(ended_at, v_now),
      updated_at = v_now
  where id = v_session.interview_id
    and user_id = p_user_id
    and status in ('live','ready','scheduled','invited');

  return v_session;
end;
$function$;

CREATE OR REPLACE FUNCTION public.kernor_get_integration_secret (
  p_secret_id uuid
)
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'vault', 'public', 'pg_temp'
  AS $function$
  select decrypted_secret
  from vault.decrypted_secrets
  where id = p_secret_id;
$function$;

CREATE OR REPLACE FUNCTION public.kernor_store_integration_secret (
  p_user_id uuid,
  p_secret  text,
  p_name    text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'vault', 'pg_temp'
  AS $function$
declare
  v_id uuid;
begin
  if p_secret is null or length(p_secret) < 1 then
    raise exception 'secret required';
  end if;

  v_id := vault.create_secret(
    p_secret,
    'kernor:' || p_user_id::text || ':' || p_name,
    'Kernor per-user integration credential'
  );

  return v_id;
end;
$function$;

ALTER TABLE "kernor_private"."billing_customers"
  ADD CONSTRAINT "billing_customers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "kernor_private"."credit_ledger"
  ADD CONSTRAINT "credit_ledger_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_answer_vault"
  ADD CONSTRAINT "application_answer_vault_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_run_events"
  ADD CONSTRAINT "application_run_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_run_questions"
  ADD CONSTRAINT "application_run_questions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_run_events"
  ADD CONSTRAINT "application_run_events_run_id_fkey" FOREIGN KEY (run_id) REFERENCES public.application_runs(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_run_questions"
  ADD CONSTRAINT "application_run_questions_run_id_fkey" FOREIGN KEY (run_id) REFERENCES public.application_runs(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_runs"
  ADD CONSTRAINT "application_runs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_status_events"
  ADD CONSTRAINT "application_status_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_status_events"
  ADD CONSTRAINT "application_status_events_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."applications"
  ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."billing_events"
  ADD CONSTRAINT "billing_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."credit_balances"
  ADD CONSTRAINT "credit_balances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."credit_transactions"
  ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."external_signals"
  ADD CONSTRAINT "external_signals_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."external_signals"
  ADD CONSTRAINT "external_signals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."follow_up_drafts"
  ADD CONSTRAINT "follow_up_drafts_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."follow_up_drafts"
  ADD CONSTRAINT "follow_up_drafts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."external_signals"
  ADD CONSTRAINT "external_signals_integration_account_id_fkey" FOREIGN KEY (integration_account_id) REFERENCES public.integration_accounts(id) ON DELETE SET NULL;

ALTER TABLE "public"."integration_accounts"
  ADD CONSTRAINT "integration_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."integration_connections"
  ADD CONSTRAINT "integration_connections_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."interview_readiness"
  ADD CONSTRAINT "interview_readiness_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."interview_round_memory"
  ADD CONSTRAINT "interview_round_memory_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."interview_round_memory"
  ADD CONSTRAINT "interview_round_memory_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."interviews"
  ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."follow_up_drafts"
  ADD CONSTRAINT "follow_up_drafts_interview_id_fkey" FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

ALTER TABLE "public"."interview_readiness"
  ADD CONSTRAINT "interview_readiness_interview_id_fkey" FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

ALTER TABLE "public"."interview_round_memory"
  ADD CONSTRAINT "interview_round_memory_interview_id_fkey" FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

ALTER TABLE "public"."interviews"
  ADD CONSTRAINT "interviews_source_signal_id_fkey" FOREIGN KEY (source_signal_id) REFERENCES public.external_signals(id) ON DELETE SET NULL;

ALTER TABLE "public"."interviews"
  ADD CONSTRAINT "interviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_runs"
  ADD CONSTRAINT "application_runs_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.job_opportunities(id) ON DELETE CASCADE;

ALTER TABLE "public"."applications"
  ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.job_opportunities(id) ON DELETE SET NULL;

ALTER TABLE "public"."job_opportunities"
  ADD CONSTRAINT "job_opportunities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."job_preferences"
  ADD CONSTRAINT "job_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_guidance"
  ADD CONSTRAINT "live_guidance_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_interview_sessions"
  ADD CONSTRAINT "live_interview_sessions_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_interview_sessions"
  ADD CONSTRAINT "live_interview_sessions_interview_id_fkey" FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_guidance"
  ADD CONSTRAINT "live_guidance_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.live_interview_sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_interview_sessions"
  ADD CONSTRAINT "live_interview_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_guidance"
  ADD CONSTRAINT "live_guidance_transcript_item_id_fkey" FOREIGN KEY (transcript_item_id) REFERENCES public.live_transcript_items(id) ON DELETE SET NULL;

ALTER TABLE "public"."live_transcript_items"
  ADD CONSTRAINT "live_transcript_items_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.live_interview_sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."live_transcript_items"
  ADD CONSTRAINT "live_transcript_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."post_interview_analyses"
  ADD CONSTRAINT "post_interview_analyses_application_id_fkey" FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;

ALTER TABLE "public"."post_interview_analyses"
  ADD CONSTRAINT "post_interview_analyses_interview_id_fkey" FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

ALTER TABLE "public"."follow_up_drafts"
  ADD CONSTRAINT "follow_up_drafts_analysis_id_fkey" FOREIGN KEY (analysis_id) REFERENCES public.post_interview_analyses(id) ON DELETE SET NULL;

ALTER TABLE "public"."post_interview_analyses"
  ADD CONSTRAINT "post_interview_analyses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."resume_tailorings"
  ADD CONSTRAINT "resume_tailorings_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.job_opportunities(id) ON DELETE CASCADE;

ALTER TABLE "public"."resume_tailorings"
  ADD CONSTRAINT "resume_tailorings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."application_runs"
  ADD CONSTRAINT "application_runs_approved_resume_id_fkey" FOREIGN KEY (approved_resume_id) REFERENCES public.resumes(id) ON DELETE RESTRICT;

ALTER TABLE "public"."applications"
  ADD CONSTRAINT "applications_tailored_resume_id_fkey" FOREIGN KEY (tailored_resume_id) REFERENCES public.resumes(id) ON DELETE SET NULL;

ALTER TABLE "public"."resume_tailorings"
  ADD CONSTRAINT "resume_tailorings_approved_resume_id_fkey" FOREIGN KEY (approved_resume_id) REFERENCES public.resumes(id) ON DELETE SET NULL;

ALTER TABLE "public"."resume_tailorings"
  ADD CONSTRAINT "resume_tailorings_source_resume_id_fkey" FOREIGN KEY (source_resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE;

ALTER TABLE "public"."resumes"
  ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX credit_ledger_user_id_idx ON kernor_private.credit_ledger USING btree (user_id);

CREATE INDEX application_answer_vault_user_idx ON public.application_answer_vault USING btree (user_id, category);

CREATE INDEX application_run_events_run_idx ON public.application_run_events USING btree (run_id, created_at);

CREATE INDEX application_run_events_user_idx ON public.application_run_events USING btree (user_id);

CREATE UNIQUE INDEX application_run_questions_run_field_unique ON public.application_run_questions USING btree (run_id, field_key)
  WHERE (field_key IS NOT NULL);

CREATE INDEX application_run_questions_run_idx ON public.application_run_questions USING btree (run_id, status);

CREATE INDEX application_run_questions_user_idx ON public.application_run_questions USING btree (user_id);

CREATE INDEX application_runs_approved_resume_idx ON public.application_runs USING btree (approved_resume_id);

CREATE INDEX application_runs_job_idx ON public.application_runs USING btree (job_id);

CREATE UNIQUE INDEX application_runs_one_active_per_user ON public.application_runs USING btree (user_id)
  WHERE (status = ANY (ARRAY['queued'::text, 'preflight'::text, 'running'::text, 'needs_user'::text, 'ready_to_submit'::text, 'submitting'::text]));

CREATE INDEX application_runs_user_status_idx ON public.application_runs USING btree (user_id, status, created_at DESC);

CREATE INDEX application_runs_workflow_idx ON public.application_runs USING btree (workflow_run_id)
  WHERE (workflow_run_id IS NOT NULL);

CREATE INDEX application_status_events_application_idx ON public.application_status_events USING btree (application_id, occurred_at DESC);

CREATE INDEX application_status_events_user_idx ON public.application_status_events USING btree (user_id, occurred_at DESC);

CREATE INDEX applications_job_id_idx ON public.applications USING btree (job_id);

CREATE INDEX applications_tailored_resume_id_idx ON public.applications USING btree (tailored_resume_id);

CREATE INDEX applications_user_status_idx ON public.applications USING btree (user_id, status, last_event_at DESC);

CREATE INDEX billing_events_user_created_idx ON public.billing_events USING btree (user_id, created_at DESC);

CREATE INDEX credit_transactions_user_created_idx ON public.credit_transactions USING btree (user_id, created_at DESC);

CREATE INDEX external_signals_account_idx ON public.external_signals USING btree (integration_account_id, occurred_at DESC)
  WHERE (integration_account_id IS NOT NULL);

CREATE INDEX external_signals_application_idx ON public.external_signals USING btree (application_id, occurred_at DESC)
  WHERE (application_id IS NOT NULL);

CREATE INDEX external_signals_user_source_idx ON public.external_signals USING btree (user_id, source, occurred_at DESC);

CREATE INDEX follow_up_drafts_analysis_idx ON public.follow_up_drafts USING btree (analysis_id)
  WHERE (analysis_id IS NOT NULL);

CREATE INDEX follow_up_drafts_application_idx ON public.follow_up_drafts USING btree (application_id);

CREATE INDEX follow_up_drafts_interview_idx ON public.follow_up_drafts USING btree (interview_id);

CREATE INDEX follow_up_drafts_user_idx ON public.follow_up_drafts USING btree (user_id, interview_id, created_at DESC);

CREATE INDEX integration_accounts_user_service_idx ON public.integration_accounts USING btree (user_id, service_type, status);

CREATE INDEX interview_readiness_user_interview_idx ON public.interview_readiness USING btree (user_id, interview_id, created_at DESC);

CREATE INDEX interview_round_memory_application_idx ON public.interview_round_memory USING btree (application_id, round_number);

CREATE INDEX interview_round_memory_user_idx ON public.interview_round_memory USING btree (user_id, application_id);

CREATE INDEX interviews_application_id_idx ON public.interviews USING btree (application_id);

CREATE UNIQUE INDEX interviews_source_external_unique ON public.interviews USING btree (user_id, source, source_external_id)
  WHERE (source_external_id IS NOT NULL);

CREATE INDEX interviews_source_signal_idx ON public.interviews USING btree (source_signal_id)
  WHERE (source_signal_id IS NOT NULL);

CREATE INDEX interviews_user_scheduled_idx ON public.interviews USING btree (user_id, scheduled_at);

CREATE INDEX job_opportunities_user_status_idx ON public.job_opportunities USING btree (user_id, status, discovered_at DESC);

CREATE INDEX live_guidance_session_idx ON public.live_guidance USING btree (session_id, created_at DESC);

CREATE INDEX live_guidance_transcript_item_idx ON public.live_guidance USING btree (transcript_item_id)
  WHERE (transcript_item_id IS NOT NULL);

CREATE INDEX live_guidance_user_idx ON public.live_guidance USING btree (user_id, created_at DESC);

CREATE INDEX live_sessions_application_idx ON public.live_interview_sessions USING btree (application_id);

CREATE INDEX live_sessions_user_status_idx ON public.live_interview_sessions USING btree (user_id, status, created_at DESC);

CREATE INDEX live_transcript_session_idx ON public.live_transcript_items USING btree (session_id, occurred_at);

CREATE INDEX live_transcript_user_idx ON public.live_transcript_items USING btree (user_id, created_at DESC);

CREATE INDEX post_interview_analysis_application_idx ON public.post_interview_analyses USING btree (application_id, created_at DESC);

CREATE INDEX post_interview_analysis_user_idx ON public.post_interview_analyses USING btree (user_id, interview_id, created_at DESC);

CREATE INDEX resume_tailorings_approved_resume_idx ON public.resume_tailorings USING btree (approved_resume_id);

CREATE INDEX resume_tailorings_source_resume_idx ON public.resume_tailorings USING btree (source_resume_id);

CREATE INDEX resume_tailorings_user_job_idx ON public.resume_tailorings USING btree (user_id, job_id, created_at DESC);

CREATE UNIQUE INDEX resumes_one_master_per_user ON public.resumes USING btree (user_id)
  WHERE (is_master = true);

CREATE TRIGGER trg_application_status_event
  AFTER INSERT OR UPDATE OF status ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION kernor_private.log_application_status_event();

CREATE TRIGGER trg_freeze_application_context
  BEFORE INSERT OR UPDATE OF job_id, tailored_resume_id ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION kernor_private.freeze_application_context();

CREATE TRIGGER trg_fulfill_billing_event
  AFTER INSERT ON public.billing_events
  FOR EACH ROW
  EXECUTE FUNCTION kernor_private.fulfill_billing_event();

CREATE TRIGGER trg_apply_credit_transaction
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION kernor_private.apply_credit_transaction();

CREATE POLICY "billing_customers_service_only" ON "kernor_private"."billing_customers"
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "credit_ledger_service_only" ON "kernor_private"."credit_ledger"
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "application_answer_vault_delete_own" ON "public"."application_answer_vault"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_answer_vault_insert_own" ON "public"."application_answer_vault"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_answer_vault_select_own" ON "public"."application_answer_vault"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_answer_vault_update_own" ON "public"."application_answer_vault"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_run_events_select_own" ON "public"."application_run_events"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_run_questions_select_own" ON "public"."application_run_questions"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_run_questions_update_own" ON "public"."application_run_questions"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_runs_select_own" ON "public"."application_runs"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "application_status_events_select_own" ON "public"."application_status_events"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "applications_delete_own" ON "public"."applications"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "applications_insert_own" ON "public"."applications"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "applications_select_own" ON "public"."applications"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "applications_update_own" ON "public"."applications"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "billing_events_service_only" ON "public"."billing_events"
  FOR ALL
  TO "service_role"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "credit_balances_select_own" ON "public"."credit_balances"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "credit_transactions_select_own" ON "public"."credit_transactions"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "external_signals_select_own" ON "public"."external_signals"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "follow_up_drafts_select_own" ON "public"."follow_up_drafts"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "follow_up_drafts_update_own" ON "public"."follow_up_drafts"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "integration_accounts_select_own" ON "public"."integration_accounts"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "integration_connections_select_own" ON "public"."integration_connections"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interview_readiness_select_own" ON "public"."interview_readiness"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interview_round_memory_delete_own" ON "public"."interview_round_memory"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interview_round_memory_insert_own" ON "public"."interview_round_memory"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interview_round_memory_select_own" ON "public"."interview_round_memory"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interview_round_memory_update_own" ON "public"."interview_round_memory"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interviews_delete_own" ON "public"."interviews"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interviews_insert_own" ON "public"."interviews"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interviews_select_own" ON "public"."interviews"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "interviews_update_own" ON "public"."interviews"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_opportunities_delete_own" ON "public"."job_opportunities"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_opportunities_insert_own" ON "public"."job_opportunities"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_opportunities_select_own" ON "public"."job_opportunities"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_opportunities_update_own" ON "public"."job_opportunities"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_preferences_delete_own" ON "public"."job_preferences"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_preferences_insert_own" ON "public"."job_preferences"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_preferences_select_own" ON "public"."job_preferences"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "job_preferences_update_own" ON "public"."job_preferences"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "live_guidance_select_own" ON "public"."live_guidance"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "live_sessions_select_own" ON "public"."live_interview_sessions"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "live_transcript_select_own" ON "public"."live_transcript_items"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "post_interview_analyses_select_own" ON "public"."post_interview_analyses"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "profiles_delete_own" ON "public"."profiles"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "profiles_insert_own" ON "public"."profiles"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "profiles_select_own" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "resume_tailorings_delete_own" ON "public"."resume_tailorings"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resume_tailorings_insert_own" ON "public"."resume_tailorings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resume_tailorings_select_own" ON "public"."resume_tailorings"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resume_tailorings_update_own" ON "public"."resume_tailorings"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resumes_delete_own" ON "public"."resumes"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resumes_insert_own" ON "public"."resumes"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resumes_select_own" ON "public"."resumes"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resumes_update_own" ON "public"."resumes"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "resume_files_delete_own" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'resumes'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid))));

CREATE POLICY "resume_files_insert_own" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

CREATE POLICY "resume_files_select_own" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'resumes'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid))));

CREATE POLICY "resume_files_update_own" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'resumes'::text) AND (owner_id = ( SELECT (auth.uid())::text AS uid))))
  WITH CHECK (((bucket_id = 'resumes'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));

GRANT EXECUTE ON FUNCTION "kernor_private"."apply_credit_transaction"() TO "postgres";

GRANT EXECUTE ON FUNCTION "kernor_private"."freeze_application_context"() TO "postgres";

GRANT EXECUTE ON FUNCTION "kernor_private"."fulfill_billing_event"() TO "postgres";

GRANT EXECUTE ON FUNCTION "kernor_private"."log_application_status_event"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."kernor_activate_live_session"(uuid, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."kernor_activate_live_session"(uuid, uuid, text) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."kernor_end_live_session"(uuid, uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."kernor_end_live_session"(uuid, uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."kernor_get_integration_secret"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."kernor_get_integration_secret"(uuid) TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."kernor_store_integration_secret"(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."kernor_store_integration_secret"(uuid, text, text) TO "postgres", "service_role";

GRANT CREATE, USAGE ON SCHEMA "kernor_private" TO "postgres";

GRANT USAGE ON SCHEMA "kernor_private" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "kernor_private"."billing_customers" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "kernor_private"."credit_ledger" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."application_answer_vault" TO "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."application_run_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."application_run_events" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."application_run_events" TO "postgres", "service_role";

REVOKE ALL ("answer_source") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("answer_source") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("answer_text") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("answer_text") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("auto_reuse_allowed") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("auto_reuse_allowed") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("resolved_at") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("resolved_at") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."application_run_questions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."application_run_questions" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."application_runs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."application_runs" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."application_runs" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."application_status_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."application_status_events" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."application_status_events" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."applications" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."applications" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."applications" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."billing_events" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."credit_balances" FROM "authenticated";

GRANT SELECT ON TABLE "public"."credit_balances" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."credit_balances" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."credit_transactions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."credit_transactions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."credit_transactions" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."external_signals" FROM "authenticated";

GRANT SELECT ON TABLE "public"."external_signals" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."external_signals" TO "postgres", "service_role";

REVOKE ALL ("body") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("body") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("recipient_email") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("recipient_email") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("recipient_name") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("recipient_name") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("subject") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("subject") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT SELECT ON TABLE "public"."follow_up_drafts" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."follow_up_drafts" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."integration_accounts" FROM "authenticated";

GRANT SELECT ON TABLE "public"."integration_accounts" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."integration_accounts" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."integration_connections" FROM "authenticated";

GRANT SELECT ON TABLE "public"."integration_connections" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."integration_connections" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."interview_readiness" FROM "authenticated";

GRANT SELECT ON TABLE "public"."interview_readiness" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."interview_readiness" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."interview_round_memory" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."interviews" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_opportunities" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."job_preferences" TO "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."live_guidance" FROM "authenticated";

GRANT SELECT ON TABLE "public"."live_guidance" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."live_guidance" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."live_interview_sessions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."live_interview_sessions" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."live_interview_sessions" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."live_transcript_items" FROM "authenticated";

GRANT SELECT ON TABLE "public"."live_transcript_items" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."live_transcript_items" TO "postgres", "service_role";

REVOKE ALL ON TABLE "public"."post_interview_analyses" FROM "authenticated";

GRANT SELECT ON TABLE "public"."post_interview_analyses" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."post_interview_analyses" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resume_tailorings" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resumes" TO "authenticated", "postgres", "service_role";

-- The block below closes a gap the initial `db pull` missed: Supabase's
-- platform auto-grants anon/authenticated default privileges on newly
-- created public-schema objects, and these were explicitly revoked on the
-- remote project as a hardening step. A fresh recreation from migrations
-- alone did not reproduce those revokes until this block was folded in
-- (verified via `supabase db diff --from local --to linked`).

REVOKE ALL ON FUNCTION "public"."kernor_activate_live_session"(uuid, uuid, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."kernor_activate_live_session"(uuid, uuid, text) FROM "authenticated";

REVOKE ALL ON FUNCTION "public"."kernor_end_live_session"(uuid, uuid) FROM "anon";

REVOKE ALL ON FUNCTION "public"."kernor_end_live_session"(uuid, uuid) FROM "authenticated";

REVOKE ALL ON FUNCTION "public"."kernor_get_integration_secret"(uuid) FROM "anon";

REVOKE ALL ON FUNCTION "public"."kernor_get_integration_secret"(uuid) FROM "authenticated";

REVOKE ALL ON FUNCTION "public"."kernor_store_integration_secret"(uuid, text, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."kernor_store_integration_secret"(uuid, text, text) FROM "authenticated";

REVOKE ALL ON TABLE "public"."application_answer_vault" FROM "anon";

REVOKE ALL ON TABLE "public"."application_run_events" FROM "anon";

REVOKE ALL ON TABLE "public"."application_run_questions" FROM "anon";

REVOKE ALL ON TABLE "public"."application_runs" FROM "anon";

REVOKE ALL ON TABLE "public"."application_status_events" FROM "anon";

REVOKE ALL ON TABLE "public"."applications" FROM "anon";

REVOKE ALL ON TABLE "public"."billing_events" FROM "anon";

REVOKE ALL ON TABLE "public"."billing_events" FROM "authenticated";

REVOKE ALL ON TABLE "public"."credit_balances" FROM "anon";

REVOKE ALL ON TABLE "public"."credit_transactions" FROM "anon";

REVOKE ALL ON TABLE "public"."external_signals" FROM "anon";

REVOKE ALL ON TABLE "public"."follow_up_drafts" FROM "anon";

REVOKE ALL ON TABLE "public"."integration_accounts" FROM "anon";

REVOKE ALL ON TABLE "public"."integration_connections" FROM "anon";

REVOKE ALL ON TABLE "public"."interview_readiness" FROM "anon";

REVOKE ALL ON TABLE "public"."interview_round_memory" FROM "anon";

REVOKE ALL ON TABLE "public"."interviews" FROM "anon";

REVOKE ALL ON TABLE "public"."job_opportunities" FROM "anon";

REVOKE ALL ON TABLE "public"."job_preferences" FROM "anon";

REVOKE ALL ON TABLE "public"."live_guidance" FROM "anon";

REVOKE ALL ON TABLE "public"."live_interview_sessions" FROM "anon";

REVOKE ALL ON TABLE "public"."live_transcript_items" FROM "anon";

REVOKE ALL ON TABLE "public"."post_interview_analyses" FROM "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

REVOKE ALL ON TABLE "public"."resume_tailorings" FROM "anon";

REVOKE ALL ON TABLE "public"."resumes" FROM "anon";

REVOKE ALL ("answer_source") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("answer_source") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("answer_text") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("answer_text") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("auto_reuse_allowed") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("auto_reuse_allowed") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("resolved_at") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("resolved_at") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."application_run_questions" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."application_run_questions" TO "authenticated";

REVOKE ALL ("body") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("body") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("recipient_email") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("recipient_email") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("recipient_name") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("recipient_name") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("status") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("status") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("subject") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("subject") ON TABLE "public"."follow_up_drafts" TO "authenticated";

REVOKE ALL ("updated_at") ON TABLE "public"."follow_up_drafts" FROM "authenticated";

GRANT UPDATE ("updated_at") ON TABLE "public"."follow_up_drafts" TO "authenticated";

