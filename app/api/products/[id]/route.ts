import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, productUpdateSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(productUpdateSchema, await readJson(req));
    const product = await prisma.product.update({ where: { id: params.id }, data });
    await audit("update", "product", product.id, product.title);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const product = await prisma.product.delete({ where: { id: params.id } });
    await audit("delete", "product", product.id, product.title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
