import { NextResponse } from "next/server";
import { setPayment, getJob } from "@/lib/store";
import { enqueueFulfillment, processFulfillment, reconcilePayment } from "@/lib/fulfillment";

async function readPayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const text = await request.text();
  try {
    return JSON.parse(text);
  } catch {
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
}

function getSessionId(payload) {
  return (
    payload.order_id ||
    payload.orderId ||
    payload.invoice_id ||
    payload.invoiceId ||
    payload.payment_id ||
    payload.paymentId ||
    payload.id ||
    null
  );
}

export async function POST(request) {
  const payload = await readPayload(request);
  const sessionId = getSessionId(payload);

  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "Missing order_id/payment_id." }, { status: 400 });
  }

  await setPayment(sessionId, {
    provider: "nowpayments",
    providerPaymentId: payload.payment_id || payload.paymentId || payload.id || sessionId,
    status: String(payload.payment_status || payload.paymentStatus || payload.status || "received").toLowerCase(),
    providerPayload: payload,
    webhookReceivedAt: new Date().toISOString(),
  });

  await enqueueFulfillment(sessionId);

  const job = await getJob(sessionId);
  if (job?.status !== "processing" && job?.status !== "sent") {
    try {
      await reconcilePayment(sessionId);
      await processFulfillment(sessionId);
    } catch {
      // worker or later reconciliation will retry
    }
  }

  return NextResponse.json({ ok: true });
}

