import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  mode: z.enum(["merge", "replace"]).default("merge"),
  categories: z
    .array(
      z.object({
        id: z.string().optional(),
        slug: z.string(),
        title: z.string(),
        sort: z.number().int().optional(),
        isVisible: z.boolean().optional(),
      }),
    )
    .default([]),
  products: z
    .array(
      z.object({
        id: z.string().optional(),
        categorySlug: z.string().optional(),
        categoryId: z.string().optional(),
        title: z.string(),
        description: z.string().default(""),
        price: z.number().int(),
        weight: z.string().default(""),
        imageUrl: z.string().default(""),
        gallery: z.array(z.string()).default([]),
        cardType: z.string().default("gallery"),
        isVisible: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        sort: z.number().int().optional(),
      }),
    )
    .default([]),
});

/** Импорт меню из JSON (формат совпадает с /api/export и data/source-menu.json). */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN") return jsonError(403, "Импорт доступен только ADMIN");
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");

    const body = await req.json().catch(() => null);
    if (!body) return jsonError(400, "Ожидается JSON");
    // Поддержка формата экспорта (categories/products) и формата source-menu.json (products с categoryTitle)
    const categoriesRaw: Array<Record<string, unknown>> = body.categories ?? [];
    const productsRaw: Array<Record<string, unknown>> = body.products ?? [];
    if (categoriesRaw.length === 0 && productsRaw.length > 0) {
      // вывести категории из продуктов
      const seen = new Map<string, string>();
      for (const p of productsRaw) {
        const slug = String(p.categorySlug ?? "");
        const title = String(p.categoryTitle ?? slug);
        if (slug && !seen.has(slug)) seen.set(slug, title);
      }
      let sort = 0;
      for (const [slug, title] of seen) categoriesRaw.push({ slug, title, sort: ++sort });
    }

    const mode = body.mode === "replace" ? "replace" : "merge";
    if (mode === "replace") {
      await prisma.$transaction([prisma.product.deleteMany(), prisma.category.deleteMany()]);
    }

    const slugToId = new Map<string, string>();
    for (const c of categoriesRaw) {
      const slug = String(c.slug ?? "").trim();
      if (!slug) continue;
      const data = {
        slug,
        title: String(c.title ?? slug),
        sort: Number(c.sort ?? 0),
        isVisible: c.isVisible === undefined ? true : Boolean(c.isVisible),
      };
      const existing = await prisma.category.findUnique({ where: { slug } });
      const cat = existing
        ? await prisma.category.update({ where: { slug }, data })
        : await prisma.category.create({ data });
      slugToId.set(slug, cat.id);
    }

    let created = 0;
    let updated = 0;
    let sortHint: Record<string, number> = {};
    for (const p of productsRaw) {
      const slug = String(p.categorySlug ?? "");
      const categoryId = slugToId.get(slug) ?? (p.categoryId ? String(p.categoryId) : undefined);
      if (!categoryId) continue;
      const data = {
        categoryId,
        title: String(p.title ?? "").trim(),
        description: String(p.description ?? ""),
        price: Math.round(Number(p.price ?? 0)),
        weight: String(p.weight ?? ""),
        imageUrl: String(p.imageUrl ?? (Array.isArray(p.images) && p.images.length ? String(p.images[0]) : "")),
        gallery: Array.isArray(p.gallery)
          ? (p.gallery as string[])
          : Array.isArray(p.images)
            ? (p.images as string[]).slice(1)
            : [],
        cardType: p.cardType === "string" ? "string" : "gallery",
        isVisible: p.isVisible === undefined ? true : Boolean(p.isVisible),
        isFeatured: p.isFeatured === undefined ? false : Boolean(p.isFeatured),
        sort: Number(p.sort ?? 0),
      };
      if (!data.title || data.price < 0) continue;
      if (!data.sort) {
        sortHint[categoryId] = (sortHint[categoryId] ?? 0) + 1;
        data.sort = sortHint[categoryId];
      }
      const existing = p.id ? await prisma.product.findUnique({ where: { id: String(p.id) } }) : null;
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.product.create({ data });
        created++;
      }
    }

    await audit("import", "menu", "", `mode=${mode} created=${created} updated=${updated}`);
    return NextResponse.json({ ok: true, created, updated, mode });
  } catch (err) {
    return handleApiError(err);
  }
}
