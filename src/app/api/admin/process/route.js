import { NextResponse } from "next/server";
import { listSessionIds } from "@/lib/store";
import { processFulfillment } from "@/lib/fulfillment";

export const maxDuration = 1200;

function isAuthorized(request) {
  const configured = process.env.WORKER_SECRET;

  if (!configured) {
    return true;
  }

  const header = request.headers.get("x-worker-secret");
  const url = new URL(request.url);
  const query = url.searchParams.get("secret");

  return header === configured || query === configured;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (sessionId) {
    try {
      const result = await processFulfillment(sessionId);
      return NextResponse.json({ ok: true, sessionId, result });
    } catch (error) {
      return NextResponse.json(
        { ok: false, sessionId, error: error instanceof Error ? error.message : "Worker failed." },
        { status: 500 }
      );
    }
  }

  const ids = await listSessionIds();
  const results = [];

  for (const id of ids) {
    try {
      const result = await processFulfillment(id);
      results.push({ sessionId: id, result });
    } catch (error) {
      results.push({
        sessionId: id,
        error: error instanceof Error ? error.message : "Worker failed.",
      });
    }
  }

  return NextResponse.json({ ok: true, results });
}
