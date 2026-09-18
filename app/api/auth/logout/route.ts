import { NextResponse } from "next/server";
import { destroySession, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
