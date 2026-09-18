# Kernor Engineering Guide

Kernor is a calm AI career product. The user journey is:

Find -> Match -> Tailor -> Approve -> Apply -> Track -> Interview -> Follow up

## Product rules

- Keep the interface calm, minimal, and obvious.
- Prefer one primary action per screen.
- Avoid noisy dashboards, excessive analytics, neon AI styling, and unnecessary controls.
- The main app navigation should remain small.
- Show users what needs attention, not everything the system knows.
- Do not invent candidate experience, certifications, skills, dates, achievements, education, clearance, or application answers.
- Optimize verified truth. Never manufacture qualifications.
- Sensitive demographic data must never be inferred.

## Current stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Auth/Postgres/Storage
- Vercel AI SDK + OpenAI
- Vercel deployment
- Stripe planned for billing

## Security rules

- Every exposed Supabase user-data table must have RLS.
- Scope user rows with auth.uid() ownership checks.
- Never put Supabase service-role/secret keys in NEXT_PUBLIC variables.
- Never put OPENAI_API_KEY in browser code.
- Credit balances are server-controlled; browser users must not be able to grant themselves credits.
- Resume files are private user data.
- Model calls handling resumes should use server-side routes and disable provider storage when supported.

## AI rules

- Resume/profile data is the candidate source of truth.
- Match scores are evidence assessments, not probabilities.
- Resume tailoring may rewrite, reorder, clarify, emphasize, or remove irrelevant material.
- Resume tailoring must not add unsupported facts.
- Each material resume change should be auditable against verified evidence.
- Do not silently submit a tailored resume without user approval.

## Billing rules

- Application pricing direction: $1 per successfully submitted application.
- Failed/unsupported application attempts should not consume an application credit.
- Interview workspace creation is free.
- Live Interview Assistant pricing direction: $19.99 per interview.
- Interview pass should be consumed only when the live session actually starts.

## Git workflow

- Do not commit directly to main.
- Build features on scoped branches.
- Keep PRs focused by milestone.
- Run npm install, npm run build, and npm run lint before requesting merge when network access permits.
- Keep dependencies pinned and commit the lockfile when dependencies are installed locally.

## Database workflow

- Prefer explicit schema changes with reviewable SQL.
- Run Supabase security and performance advisors after schema changes.
- Do not weaken RLS to fix permission errors.

## UX language

Prefer human language:
- "I found 12 roles worth looking at."
- "Your resume is ready."
- "Review changes."
- "Approve resume."

Avoid robotic language:
- "AI AGENT EXECUTED TASK"
- "AUTONOMOUS WORKFLOW COMPLETE"
- excessive exclamation marks

## Current milestones

v0.1: foundation, auth, onboarding, dashboard
v0.2: Kernor Match
v0.3: resume tailoring, diff review, explicit approval\nv0.4: credits + Stripe billing\nv0.5: Kernor Apply assisted browser workflow\nv0.6: Kernor Track application lifecycle
v0.7: provider-neutral Email + Calendar detection\nv0.8: Interview Workspace / Readiness
v0.9: Multi-Round Interview Memory
v0.10: Kernor Live realtime interview assistant

Next expected milestones:
- application credits + Stripe
- controlled browser application workflow
- application tracking
- post-interview analysis + follow-up (Phase 11)
- integration, merge, runtime QA in VS Code + Codex


## Integration rules

- Email and Calendar are independent capabilities.
- Never make Gmail a product dependency.
- Normalize provider signals before they reach application tracking.
- OAuth providers should use the narrowest read-only scopes needed.
- iCloud/custom IMAP secrets must stay in Supabase Vault, not ordinary tables.
- Ambiguous messages must not silently change application status.


## Interview memory rules

- Round memory may contain user-recorded observations, questions, topics, examples, and commitments.
- Do not treat interviewer signals as verified intent.
- Do not predict hiring outcomes.
- Prior-round memory should improve continuity, not encourage fabricated stories.
- Phase 10 Live can populate this model from transcript context.
- Full post-interview analysis belongs after Live.


## Live interview rules

- The candidate remains the actual speaker.
- Require explicit audio consent before transcription.
- Do not implement stealth, concealment, monitoring bypass, anti-cheat evasion, or employer-control circumvention.
- A Live pass is consumed only after the realtime connection successfully activates.
- Reconnects to the same active Live session must be idempotent.
- Live guidance must remain grounded in frozen verified candidate context.
