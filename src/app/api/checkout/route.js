import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { createInvoice } from "@/lib/nowpayments";
import { setPayment } from "@/lib/store";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request) {
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const body = schema.parse(await request.json());
    const sessionId = crypto.randomUUID();
    const description = "AnarchI wallet safety report";
    const callbackUrl = `${origin}/api/webhooks/nowpayments`;

    let invoiceUrl = "";
    let invoiceId = sessionId;

    if (process.env.NODE_ENV === "development" && !process.env.NOWPAYMENTS_API_KEY) {
      console.log("[DEV] NOWPAYMENTS_API_KEY is missing. Enabling sandbox checkout bypass.");
      invoiceUrl = `${origin}/intake?session_id=${sessionId}`;
      
      // Auto-confirm payment status so intake page unlocks immediately
      await setPayment(sessionId, {
        status: "finished",
        provider: "nowpayments_sandbox",
        providerPaymentId: sessionId,
        invoiceUrl,
        invoiceId,
        raw: { sandbox: true },
        email: body.email,
        startedAt: new Date().toISOString(),
        amountTotal: 50,
        currency: "usd",
        paidAt: new Date().toISOString(),
      });
    } else {
      const invoice = await createInvoice({
        orderId: sessionId,
        description,
        amountUsd: 50,
        ipnCallbackUrl: callbackUrl,
        successUrl: `${origin}/intake?session_id=${sessionId}`,
        cancelUrl: `${origin}/?checkout=cancelled`,
      });

      invoiceUrl = invoice.invoiceUrl;
      invoiceId = invoice.invoiceId;

      await setPayment(sessionId, {
        status: "created",
        provider: "nowpayments",
        providerPaymentId: invoice.paymentId || invoice.invoiceId || sessionId,
        invoiceUrl: invoice.invoiceUrl,
        invoiceId: invoice.invoiceId,
        raw: invoice.raw,
        email: body.email,
        startedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ url: invoiceUrl, sessionId });
  } catch (error) {
    const isValidationError = error instanceof z.ZodError;
    const message = isValidationError
      ? "Please enter a valid email address."
      : error instanceof Error
        ? error.message
        : "We could not start checkout right now.";

    return NextResponse.json({ error: message }, { status: isValidationError ? 400 : 502 });
  }
}
