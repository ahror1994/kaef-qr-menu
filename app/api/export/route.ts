import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

/** Полный экспорт меню и настроек в JSON. */
export async function GET() {
  try {
    await requireUser();
    const [categories, products, labels, settings, media] = await Promise.all([
      prisma.category.findMany({ orderBy: { sort: "asc" } }),
      prisma.product.findMany({ orderBy: { sort: "asc" } }),
      prisma.label.findMany(),
      prisma.setting.findMany(),
      prisma.mediaAsset.findMany(),
    ]);
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      categories,
      products,
      labels,
      settings,
      media,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="kaef-menu-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
