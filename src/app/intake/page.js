import Image from "next/image";
import IntakeForm from "./IntakeForm";
import PaymentGate from "./PaymentGate";
import { getPayment } from "@/lib/store";

export default async function IntakePage({ searchParams }) {
  const params = await searchParams;
  const sessionId = params?.session_id;

  if (!sessionId) {
    return (
      <main className="page">
        <div className="noise" />
        <div className="container">
          <section className="panel">
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.3rem)", margin: 0, letterSpacing: "-0.04em" }}>
              Payment session missing.
            </h1>
            <p className="muted">Start a checkout from the home page to generate a secure intake session.</p>
          </section>
        </div>
      </main>
    );
  }

  const payment = await getPayment(sessionId);
  const email = payment?.email || "";

  return (
    <main className="page">
      <div className="noise" />
      <div className="container">
        <header className="topbar">
          <div className="brand">
            <Image
              src="/brand/anarchi-transparent.png"
              alt="AnarchI"
              width={44}
              height={44}
              className="brand-image"
              priority
            />
            <div>
              <div>AnarchI Intake</div>
              <div className="mini">AnarchI powered</div>
            </div>
          </div>
          <div className="pill">Session {sessionId}</div>
        </header>

        <section className="panel">
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.3rem)", margin: "0 0 10px", letterSpacing: "-0.04em" }}>
            Finish the intake and we&apos;ll start the encrypted report.
          </h1>
          <p className="muted" style={{ maxWidth: "70ch", marginTop: 0 }}>
            This page opens after checkout starts. If payment is still confirming, we&apos;ll keep checking and unlock
            the intake as soon as it is confirmed.
          </p>
          <p className="muted" style={{ maxWidth: "70ch", marginTop: 0 }}>
            Optional deep analysis is available through read-only proof or signed-message evidence. We do not ask for
            private keys.
          </p>

          <div className="section">
            <PaymentGate sessionId={sessionId} initialPaymentStatus={payment?.status || "missing"} email={email}>
              <IntakeForm sessionId={sessionId} email={email} />
            </PaymentGate>
          </div>
        </section>
      </div>
    </main>
  );
}
