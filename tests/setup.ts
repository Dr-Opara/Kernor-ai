// Keeps tests from accidentally depending on real provider credentials.
// Individual tests mock the modules that read these directly (Supabase
// clients, Stripe, OpenAI) rather than relying on these values being
// meaningful, but setting them prevents an unset-env-var crash if a code
// path is exercised without an explicit mock.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||= "test-publishable-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
process.env.OPENAI_API_KEY ||= "test-openai-key";
process.env.STRIPE_SECRET_KEY ||= "test-stripe-key";
process.env.STRIPE_WEBHOOK_SECRET ||= "test-webhook-secret";
process.env.CRON_SECRET ||= "test-cron-secret";
