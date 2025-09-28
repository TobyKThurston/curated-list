import { NextRequest } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
      console.error("❌ Webhook signature verification failed:", e.message);
      return new Response(`Webhook Error: ${e.message}`, { status: 400 });
    }
    console.error("❌ Unknown webhook error");
    return new Response("Webhook Error: Unknown", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Retrieve payment intent
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

Thank you for confirming your liquor delivery for event ${eventNumber} with the Columbia Bartending Agency.

The team at Glasslist NYC is currently working with your bartender to build your liquor package & handle logistics. We will reach out to share package options & confirm delivery details within 48 hours.

If you have any questions, please direct them to reid@columbiabartending.com.

Best,
Your teams at Glasslist NYC & the Columbia Bartending Agency
          `,
        });
      }

      console.log("✅ Sent order emails (to you + customer)");
    } catch (err) {
      console.error("❌ Error handling checkout.session.completed:", err);
    }
  }

  return new Response("ok", { status: 200 });
}
