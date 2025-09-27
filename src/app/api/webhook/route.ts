import { NextRequest } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// 👇 Required so Next.js doesn’t parse body before Stripe signature check
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const rawBody = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Retrieve payment intent for metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(
        session.payment_intent as string
      );

      const { name, event_number: eventNumber, age21 } = paymentIntent.metadata;
      const email = session.customer_email ?? undefined;
      const amount = (session.amount_total ?? 0) / 100;

      // Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Internal notification
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

      // Customer confirmation
      if (email) {
        await transporter.sendMail({
          from: `"Columbia Bartending" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your Curated Alcohol List Order Confirmation",
          text: `
Hi ${name},

Thank you for your order with Columbia Bartending! 

We’ve received your payment of $${amount}.
Your Event Number is: ${eventNumber}.

We’ll match your order to your event and handle logistics.
If you have any questions, just reply to this email.

– Columbia Bartending
          `,
        });
      }

      console.log("✅ Sent order emails (internal + customer)");
    } catch (err) {
      console.error("❌ Error handling checkout.session.completed:", err);
    }
  }

  return new Response("ok", { status: 200 });
}
