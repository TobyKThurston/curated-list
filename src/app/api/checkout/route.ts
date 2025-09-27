import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

export const runtime = "nodejs";

// ✅ use your account's default API version OR pin to a real one like "2023-10-16"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const Body = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  event_number: z.string().min(1).max(80),
  age21: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = Body.parse(json);

    const idempotencyKey = `${body.event_number}:${crypto.randomUUID()}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: body.email,
        line_items: [
          {
            price: process.env.PRICE_CURATED as string,
            quantity: 1,
          },
        ],
        success_url: `${process.env.BASE_URL}/thank-you?sid={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/`,
        payment_intent_data: {
          metadata: {
            event_number: body.event_number,
            name: body.name,
            age21: String(body.age21),
          },
        },
      },
      { idempotencyKey }
    );

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    // Stripe errors get caught as generic Error, not `Stripe.errors.StripeError`
    if (err instanceof Error && "type" in err) {
      console.error("Stripe error:", err.message);
      return NextResponse.json(
        { error: "Payment processing error" },
        { status: 502 }
      );
    }

    if (err instanceof Error) {
      console.error("Checkout error:", err.message);
    } else {
      console.error("Checkout error (non-Error):", err);
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
