import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { storage } from "@/lib/storage";

type Params = { params: { id: string } };

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });
    if (!asset) return jsonError(404, "Файл не найден");
    await storage.remove(asset.path);
    await prisma.mediaAsset.delete({ where: { id: asset.id } });
    await audit("delete", "media", asset.id, asset.filename);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
