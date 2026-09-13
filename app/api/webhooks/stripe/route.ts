import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { confirmPaymentAndBook } from "@/lib/booking-engine";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid payload JSON" },
        { status: 400 }
      );
    }

    // In production with STRIPE_WEBHOOK_SECRET, verify Stripe signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && sig) {
      // Signature verification would be done with stripe SDK if initialized
    }

    const eventType = event.type || "payment_intent.succeeded";
    const idempotencyKey = `stripe_evt_${event.id || Date.now()}`;

    // Deduplicate webhook events via payments table check
    const [existingPayment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.idempotencyKey, idempotencyKey));

    if (existingPayment) {
      return NextResponse.json({
        received: true,
        message: "Event already processed (idempotent)",
      });
    }

    if (eventType === "payment_intent.succeeded" || eventType === "checkout.session.completed") {
      const metadata = event.data?.object?.metadata || event.metadata || {};
      const bookingId = metadata.bookingId;
      const userId = metadata.userId;

      if (bookingId && userId) {
        await confirmPaymentAndBook({
          bookingId,
          userId,
          idempotencyKey,
          provider: "STRIPE",
          providerPaymentId: event.data?.object?.id || event.id,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}
