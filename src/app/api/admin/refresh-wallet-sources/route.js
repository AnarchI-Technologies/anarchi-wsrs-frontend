import { NextResponse } from "next/server";
import { refreshKnownWalletSnapshots } from "@/lib/adapters";

export const maxDuration = 1200;

function isAuthorized(request) {
  const configured = process.env.WORKER_SECRET || process.env.ADMIN_SECRET;

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

  const results = await refreshKnownWalletSnapshots({
    sessionIds: sessionId ? [sessionId] : undefined,
  });

  return NextResponse.json({
    ok: true,
    refreshedCount: results.filter((result) => result.ok).length,
    failedCount: results.filter((result) => !result.ok).length,
    results,
  });
}
