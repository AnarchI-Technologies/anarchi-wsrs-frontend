import { handleIntakeRequest } from "@/lib/intake-handler";

export async function POST(request) {
    // This route handles the primary intake form submission.
    return handleIntakeRequest(request);
}