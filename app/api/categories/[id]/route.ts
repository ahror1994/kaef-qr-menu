import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, categoryUpdateSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(categoryUpdateSchema, await readJson(req));
    const category = await prisma.category.update({ where: { id: params.id }, data });
    await audit("update", "category", category.id, category.title);
    return NextResponse.json({ category });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const category = await prisma.category.delete({ where: { id: params.id } });
    await audit("delete", "category", category.id, category.title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
