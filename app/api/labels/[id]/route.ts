import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { audit } from "@/lib/audit";

type Params = { params: { id: string } };

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const label = await prisma.label.delete({ where: { id: params.id } });
    await audit("delete", "label", label.id, label.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
