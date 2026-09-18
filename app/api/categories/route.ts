import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, categorySchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    await requireUser();
    const categories = await prisma.category.findMany({
      orderBy: { sort: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(categorySchema, await readJson(req));
    const maxSort = await prisma.category.aggregate({ _max: { sort: true } });
    const category = await prisma.category.create({ data: { ...data, sort: data.sort || (maxSort._max.sort ?? 0) + 1 } });
    await audit("create", "category", category.id, category.title);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
