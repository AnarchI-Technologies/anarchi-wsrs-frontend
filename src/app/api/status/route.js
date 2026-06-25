import { NextResponse } from "next/server";
import { getJob, getPayment, getIntake, getReport } from "@/lib/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "We need a session id to look up your checkout." }, { status: 400 });
  }

  const [payment, intake, job, report] = await Promise.all([
    getPayment(sessionId),
    getIntake(sessionId),
    getJob(sessionId),
    getReport(sessionId),
  ]);

  return NextResponse.json({
    sessionId,
    paymentStatus: payment?.status || "missing",
    intakeStatus: intake?.status || "missing",
    jobStatus: job?.status || "missing",
    reportStatus: report?.status || "missing",
    report,
  });
}
