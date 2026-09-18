import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/** Целостность данных, извлечённых из исходного сайта. */
const dataFile = path.join(__dirname, "..", "..", "data", "source-menu.json");
const menu = JSON.parse(fs.readFileSync(dataFile, "utf-8"));

describe("data/source-menu.json", () => {
  it("содержит категории и блюда", () => {
    expect(menu.categories.length).toBeGreaterThanOrEqual(30);
    expect(menu.products.length).toBeGreaterThanOrEqual(150);
  });
  it("у каждого блюда есть категория, название и цена", () => {
    const slugs = new Set(menu.categories.map((c: { slug: string }) => c.slug));
    for (const p of menu.products) {
      expect(slugs.has(p.categorySlug), p.title).toBe(true);
      expect(p.title.trim().length).toBeGreaterThan(0);
      expect(Number(p.price)).not.toBeNaN();
    }
  });
  it("слаги категорий уникальны", () => {
    const slugs = menu.categories.map((c: { slug: string }) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("не содержит упоминаний удалённого брендинга в данных", () => {
    expect(JSON.stringify(menu).toLowerCase()).not.toContain("core menu");
  });
});
