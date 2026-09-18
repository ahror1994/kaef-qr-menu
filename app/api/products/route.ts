import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, productSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    await requireUser();
    const categoryId = new URL(req.url).searchParams.get("categoryId");
    const products = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { sort: "asc" },
    });
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(productSchema, await readJson(req));
    const maxSort = await prisma.product.aggregate({ where: { categoryId: data.categoryId }, _max: { sort: true } });
    const product = await prisma.product.create({
      data: { ...data, sort: data.sort || (maxSort._max.sort ?? 0) + 1 },
    });
    await audit("create", "product", product.id, product.title);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
