# Kernor.ai

**Your next move, handled.**

Kernor is a calm AI-assisted career workspace that helps a candidate move through:

**Find → Review → Apply → Track → Interview → Follow up**

## v0.1

The foundation now includes:

- Marketing landing page
- Supabase email/password authentication
- Protected logged-in routes
- Resume-first onboarding
- Private PDF/DOCX resume storage
- Candidate profile + job preference persistence
- Calm live-data dashboard
- Applications view
- Interview workspace
- Candidate profile editing
- Credit balance read model

## Supabase

The project uses Supabase for authentication, Postgres, RLS, and private resume storage.

Public user-data tables:

- `profiles`
- `job_preferences`
- `resumes`
- `job_opportunities`
- `applications`
- `interviews`
- `credit_balances`

Private server-only billing tables live in `kernor_private`.

Every exposed user-data table has Row Level Security enabled. Candidate records are scoped to the authenticated user. Credit balances are intentionally read-only from the user-facing client so paid credits cannot be self-issued.

Resume files live in a private `resumes` bucket and are restricted to the owning user.

## Environment

Copy `.env.example` to `.env.local` and configure:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not add Supabase secret/service-role keys to browser environment variables.

## Product principles

1. One screen, one obvious next action.
2. Show what needs attention, not everything Kernor knows.
3. Keep AI behavior understandable and reviewable.
4. Never fabricate candidate qualifications.
5. Charge application credits only after confirmed successful submission.
6. Keep interview workspace free; consume an interview pass only when Kernor Live starts.

## Pricing direction

- $1 per successfully submitted application
- $19.99 per live interview
- No required subscription

## Next milestone

Kernor Match:

1. Ingest the verified candidate profile and master resume.
2. Accept/discover job descriptions.
3. Generate an explainable match score.
4. Surface only strong matches.
5. Pass the selected job into resume tailoring.


## Kernor Match v0.2

Kernor Match adds the first real AI workflow.

### Flow

1. Candidate completes onboarding and uploads a master resume.
2. The first match request parses the resume into verified structured facts.
3. The parsed profile is cached in Supabase for reuse.
4. The user pastes a complete job description.
5. Kernor compares the job only against verified candidate facts and preferences.
6. The final score is calculated deterministically from weighted dimensions.
7. Explicit critical missing requirements cap an otherwise high semantic score.
8. The match and explanation are saved to `job_opportunities`.

### Match weighting

- Required qualifications: 25%
- Professional experience: 20%
- Skills & tools: 20%
- Role & seniority: 10%
- Industry/domain: 10%
- Education & certifications: 5%
- Location/work arrangement: 5%
- Candidate preferences: 5%

The default candidate threshold remains **85%+**.

### AI privacy

Resume parsing and match assessment are performed server-side. The OpenAI API key is never exposed to the browser, and model requests are configured with storage disabled.

PDF resumes are passed as file input. DOCX resumes are converted to raw text server-side before structured extraction.
