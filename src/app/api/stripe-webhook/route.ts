import { NextRequest } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion,
  });

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const raw = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (e: unknown) {
    if (e instanceof Error) {
      return new Response(`Webhook Error: ${e.message}`, { status: 400 });
    }
    return new Response("Webhook Error: Unknown", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // PaymentIntent retrieval
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    const { name, event_number: eventNumber, age21 } = paymentIntent.metadata;
    const email = session.customer_email ?? undefined;
    const amount = (session.amount_total ?? 0) / 100;

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Notify internal team
    await transporter.sendMail({
      from: `"Curation Orders" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
      subject: "🎉 New Alcohol Curation Order Paid",
      text: `
A new order has been completed:

Name: ${name}
Email: ${email}
Event Number: ${eventNumber}
Age 21+: ${age21}

Stripe Session ID: ${session.id}
Amount Paid: $${amount}
      `,
    });

    // Confirmation email to customer
    if (email) {
      await transporter.sendMail({
        from: `"Columbia Bartending" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Curated Alcohol List Order Confirmation",
        text: `
Hi ${name},

Thank you for your order with Columbia Bartending! 🎉

We’ve received your payment of $${amount}.
Your Event Number is: ${eventNumber}.

We’ll match your order to your event and handle logistics.
If you have any questions, just reply to this email.

– Columbia Bartending
        `,
      });
    }

    console.log("✅ Sent order emails (to you + customer)");
  }

  return new Response("ok", { status: 200 });
}
