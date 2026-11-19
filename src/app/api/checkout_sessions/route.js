import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Legacy-compatible checkout entry point.
 *
 * Stripe sessions are created by the Express backend, which is the only place
 * that knows the authenticated vendor. This route simply forwards the caller's
 * session cookie/JWT — it never trusts vendorId/email from the browser.
 */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.planId || body.plan;

    if (!["premium_monthly", "premium_yearly"].includes(plan)) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription plan." },
        { status: 400 },
      );
    }

    const requestHeaders = await headers();
    const forwarded = { "Content-Type": "application/json" };

    const cookie = requestHeaders.get("cookie");
    const authorization = requestHeaders.get("authorization");
    if (cookie) forwarded.cookie = cookie;
    if (authorization) forwarded.authorization = authorization;

    const response = await fetch(
      `${BACKEND_URL.replace(/\/+$/, "")}/api/v1/subscription/create-checkout-session`,
      {
        method: "POST",
        headers: forwarded,
        body: JSON.stringify({ plan }),
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to start Stripe checkout.",
      },
      { status: 500 },
    );
  }
}
