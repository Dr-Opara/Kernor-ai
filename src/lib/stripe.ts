import Stripe from "stripe";

// Constructed lazily (not at module load) so builds and routes that never
// touch billing don't require STRIPE_SECRET_KEY to be present.
let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    stripeClient = new Stripe(apiKey, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
    });
  }
  return stripeClient;
}
