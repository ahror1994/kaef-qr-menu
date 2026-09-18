import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export interface StorageDriver {
  save(filename: string, data: Buffer): Promise<{ url: string; path: string }>;
  remove(path: string): Promise<void>;
}

/**
 * Local disk driver (default). Files live in ./storage/uploads (outside Git),
 * served through /api/media/file/[...path].
 */
class LocalDriver implements StorageDriver {
  private root = path.join(process.cwd(), "storage", "uploads");

  async save(filename: string, data: Buffer) {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${Date.now()}-${randomBytes(4).toString("hex")}-${safe}`;
    const dir = path.join(this.root, key.slice(0, 2));
    await mkdir(dir, { recursive: true });
    const full = path.join(dir, key);
    await writeFile(full, data);
    return { url: `/api/media/file/${key}`, path: path.relative(this.root, full) };
  }

  async remove(relPath: string) {
    try {
      await unlink(path.join(this.root, relPath));
    } catch {
      /* already gone */
    }
  }
}

/**
 * S3-compatible driver (Cloudflare R2, MinIO, AWS S3). Activate with MEDIA_DRIVER=s3.
 * Kept dependency-light: signed PUT via fetch is omitted — configure a presigned
 * upload proxy or install @aws-sdk/client-s3 in deployments that need S3.
 */
class S3Driver implements StorageDriver {
  async save(): Promise<{ url: string; path: string }> {
    throw new Error("S3 driver requires @aws-sdk/client-s3 — see docs/deployment.md");
  }
  async remove(): Promise<void> {}
}

export const storage: StorageDriver = process.env.MEDIA_DRIVER === "s3" ? new S3Driver() : new LocalDriver();

export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);

export function isImageFile(filename: string) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
