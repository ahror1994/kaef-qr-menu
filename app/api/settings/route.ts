import { NextResponse } from "next/server";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, settingsSchema } from "@/lib/validation";
import { getSettings, saveSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ settings: await getSettings() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(settingsSchema, await readJson(req));
    await saveSettings(data);
    await audit("update", "settings", "", Object.keys(data).join(","));
    return NextResponse.json({ settings: data });
  } catch (err) {
    return handleApiError(err);
  }
}
