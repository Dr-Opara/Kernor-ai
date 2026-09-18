# Developing Kernor with Codex in VS Code

Kernor is designed to be developed primarily in the repository with Codex.

## Recommended workflow

1. Clone the repository locally.
2. Open the repository root in VS Code.
3. Install the official **Codex** extension from OpenAI.
4. Sign in with the same ChatGPT account/workspace you use for Codex.
5. Open the Kernor repository root so Codex can read `AGENTS.md`.
6. Work from a feature branch, never directly from `main`.
7. Give Codex one product milestone at a time.
8. Let Codex inspect the relevant files before making changes.
9. Require Codex to run:
   - `npm install`
   - `npm run build`
   - `npm run lint`
10. Review the diff before pushing or opening a PR.

## Environment

Create `.env.local` from `.env.example`.

Never commit:
- OpenAI API keys
- Supabase secret/service-role keys
- Stripe secret keys
- OAuth client secrets

## Suggested first prompt in a new Codex session

Read `AGENTS.md`, `README.md`, and the current open feature branch before making changes.

You are working on Kernor, a calm AI career product. Preserve the existing product rules and visual simplicity. Do not fabricate candidate information. Keep Supabase RLS intact. Before finishing, run the build and lint checks and summarize the files changed, tests run, and any remaining risks.

## Feature prompt pattern

Use this structure for larger tasks:

**Goal**
What the user should be able to do.

**Current behavior**
What exists today.

**Required behavior**
The exact user flow and acceptance criteria.

**Constraints**
Security, product, design, and data rules.

**Done when**
Build passes, lint passes, primary flow works, and the change is ready for review.

## Current product sequence

- v0.1 — foundation/auth/onboarding/dashboard
- v0.2 — Match
- v0.3 — Resume Tailoring
- next — Stripe/credits
- then — controlled application browser
- then — tracking and interview detection
- then — interview workspace / Kernor Live
