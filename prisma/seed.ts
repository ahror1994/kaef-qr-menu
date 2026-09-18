/**
 * Seed: создаёт настройки по умолчанию и (если меню пусто) импортирует меню
 * из data/source-menu.json, извлечённого из исходного сайта.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface SourceProduct {
  postId: string;
  categorySlug: string;
  categoryTitle: string;
  title: string;
  description: string;
  price: string;
  weight: string;
  images: string[];
  marks: string[];
}

async function main() {
  // --- настройки по умолчанию ---
  const defaults: Record<string, string> = {
    siteTitle: "KAEF HOOKAH LOUNGE — QR MENU",
    siteDescription:
      "От фирменных кальянов до изысканных блюд и закусок. Каждая подача — это настроение и стиль.",
    logoUrl: "/source-assets/uploads/2025/04/logo.svg",
    footerCopyright: "KAEF HOOKAH LOUNGE",
    year: "2026",
    footerAddress: "",
    footerPhone: "",
    footerWorkingHours: "",
    footerLinks: "[]",
    footerSocials: JSON.stringify([{ label: "Telegram", url: "https://t.me/ricardo_quattro" }]),
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // --- суперпользователь из env, если пользователей ещё нет ---
  const userCount = await prisma.user.count();
  if (userCount === 0 && process.env.SUPERADMIN_EMAIL && process.env.SUPERADMIN_PASSWORD) {
    await prisma.user.create({
      data: {
        email: process.env.SUPERADMIN_EMAIL,
        name: "Super Admin",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 12),
      },
    });
    console.log(`Создан суперпользователь: ${process.env.SUPERADMIN_EMAIL}`);
  }

  // --- меню из исходного сайта ---
  if (await prisma.category.count()) {
    console.log("Меню уже есть в базе — seed меню пропущен.");
    return;
  }
  const dataFile = path.join(__dirname, "..", "data", "source-menu.json");
  if (!fs.existsSync(dataFile)) {
    console.log("data/source-menu.json не найден — меню не импортировано.");
    return;
  }
  const source = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  const catSort = new Map<string, { title: string; sort: number }>();
  for (const c of source.categories as { slug: string; title: string }[]) {
    catSort.set(c.slug, { title: c.title, sort: catSort.size + 1 });
  }
  const catId = new Map<string, string>();
  for (const [slug, info] of catSort) {
    const cat = await prisma.category.create({
      data: { slug, title: info.title, sort: info.sort },
    });
    catId.set(slug, cat.id);
  }
  const perCat = new Map<string, number>();
  const products = source.products as SourceProduct[];
  for (const p of products) {
    const categoryId = catId.get(p.categorySlug);
    if (!categoryId) continue;
    const sort = (perCat.get(categoryId) ?? 0) + 1;
    perCat.set(categoryId, sort);
    const gallery = p.images.slice(1);
    await prisma.product.create({
      data: {
        categoryId,
        title: p.title,
        description: p.description,
        price: Math.round(Number(p.price) || 0),
        weight: p.weight,
        imageUrl: p.images[0] ?? "",
        gallery,
        cardType: p.images.length ? "gallery" : "string",
        isFeatured: (p.marks ?? []).length > 0,
        sort,
      },
    });
  }
  console.log(`Импортировано: ${catSort.size} категорий, ${products.length} блюд.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
