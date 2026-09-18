/**
 * Импорт меню из data/source-menu.json в БД (формат source-menu.json).
 * Использование: npm run import:source-menu
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const file = path.join(__dirname, "..", "data", "source-menu.json");
  const source = JSON.parse(fs.readFileSync(file, "utf-8"));
  const catId = new Map<string, string>();
  let sort = 0;
  for (const c of source.categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { title: c.title, sort: ++sort },
      create: { slug: c.slug, title: c.title, sort: sort },
    });
    catId.set(c.slug, cat.id);
  }
  const perCat = new Map<string, number>();
  for (const p of source.products) {
    const categoryId = catId.get(p.categorySlug);
    if (!categoryId) continue;
    const s = (perCat.get(categoryId) ?? 0) + 1;
    perCat.set(categoryId, s);
    const data = {
      categoryId,
      title: p.title,
      description: p.description ?? "",
      price: Math.round(Number(p.price) || 0),
      weight: p.weight ?? "",
      imageUrl: (p.images ?? [])[0] ?? "",
      gallery: (p.images ?? []).slice(1),
      cardType: (p.images ?? []).length ? "gallery" : "string",
      isFeatured: (p.marks ?? []).length > 0,
      sort: s,
    };
    await prisma.product.create({ data });
  }
  console.log("Импорт завершён.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
