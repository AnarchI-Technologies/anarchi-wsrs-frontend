import { handleIntakeRequest } from "@/lib/intake-handler";

export async function POST(request) {
  // This route likely serves as an alias or legacy endpoint for intake.
  return handleIntakeRequest(request);
}