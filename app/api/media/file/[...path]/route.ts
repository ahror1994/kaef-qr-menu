import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Readable } from "stream";

type Params = { params: { path: string[] } };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

/** Публичная раздача загруженных файлов из ./storage/uploads (вне Git). */
export async function GET(_req: Request, { params }: Params) {
  // key может содержать "[...path]", но мы сохраняем плоские имена — берём целиком
  const rel = decodeURIComponent(params.path.join("/"));
  if (params.path.some((seg) => seg === ".." || seg.includes("\\") || seg === "")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const asset = await prisma.mediaAsset.findFirst({ where: { path: { endsWith: rel } } });
  const full = path.join(process.cwd(), "storage", "uploads", rel);
  if (!existsSync(full)) return new NextResponse("Not found", { status: 404 });
  if (!asset) {
    // файл есть на диске, но не зарегистрирован — регистрируем (self-heal)
    await prisma.mediaAsset
      .create({
        data: {
          url: `/api/media/file/${rel}`,
          path: rel,
          filename: rel.split("-").slice(2).join("-"),
          size: statSync(full).size,
          type: "IMAGE",
        },
      })
      .catch(() => null);
  }
  const ext = path.extname(rel).toLowerCase();
  const stream = Readable.toWeb(createReadStream(full)) as unknown as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
