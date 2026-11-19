import "server-only";
import Stripe from "stripe";

/**
 * Server-only Stripe client. Checkout sessions are created by the Express
 * backend (`POST /api/v1/subscription/create-checkout-session`), so this is a
 * validated utility kept for future server-side Stripe work.
 *
 * NEVER read a NEXT_PUBLIC_* secret — those values are inlined into the
 * browser bundle.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Add it to the server environment.",
    );
  }
  if (!client) client = new Stripe(apiKey);
  return client;
}
