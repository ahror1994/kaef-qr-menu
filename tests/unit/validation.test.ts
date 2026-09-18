import { describe, expect, it } from "vitest";
import { categorySchema, productSchema, settingsSchema } from "@/lib/validation";

describe("categorySchema", () => {
  it("принимает корректную категорию", () => {
    const r = categorySchema.safeParse({ slug: "osnovnaya", title: "Закуски" });
    expect(r.success).toBe(true);
  });
  it("отклоняет slug с кириллицей и пробелами", () => {
    const r = categorySchema.safeParse({ slug: "Закуски 1", title: "Закуски" });
    expect(r.success).toBe(false);
  });
});

describe("productSchema", () => {
  const base = { categoryId: "c1", title: "Борщ", price: 450 };
  it("заполняет значения по умолчанию", () => {
    const r = productSchema.parse(base);
    expect(r.isVisible).toBe(true);
    expect(r.cardType).toBe("gallery");
    expect(r.gallery).toEqual([]);
  });
  it("отклоняет отрицательную цену", () => {
    expect(productSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
  });
  it("отклоняет пустое название", () => {
    expect(productSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
  });
  it("ограничивает галерею 10 изображениями", () => {
    const gallery = Array.from({ length: 11 }, (_, i) => `/img/${i}.webp`);
    expect(productSchema.safeParse({ ...base, gallery }).success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("год по умолчанию 2026", () => {
    expect(settingsSchema.parse({}).year).toBe("2026");
  });
});
