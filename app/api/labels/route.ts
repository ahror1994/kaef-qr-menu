import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, labelSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ labels: await prisma.label.findMany({ orderBy: { name: "asc" } }) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(labelSchema, await readJson(req));
    const label = await prisma.label.upsert({ where: { name: data.name }, update: data, create: data });
    await audit("create", "label", label.id, label.name);
    return NextResponse.json({ label }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
