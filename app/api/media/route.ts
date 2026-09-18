import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { isImageFile, MAX_UPLOAD_BYTES, storage } from "@/lib/storage";

export async function GET() {
  try {
    await requireUser();
    const media = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
    return NextResponse.json({ media });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError(400, "Файл не найден в поле 'file'");
    if (file.size > MAX_UPLOAD_BYTES) return jsonError(400, "Файл больше 10 МБ");
    if (!isImageFile(file.name)) return jsonError(400, "Разрешены только изображения");
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await storage.save(file.name, buffer);
    const asset = await prisma.mediaAsset.create({
      data: {
        url: saved.url,
        path: saved.path,
        filename: file.name,
        size: file.size,
        type: "IMAGE",
      },
    });
    await audit("upload", "media", asset.id, `${file.name} (${file.size} B) by ${user.email}`);
    return NextResponse.json({ asset }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
