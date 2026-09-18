import { z } from "zod";

export const productSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  price: z.coerce.number().int().min(0).max(10_000_000),
  weight: z.string().max(50).default(""),
  imageUrl: z.string().max(2000).default(""),
  gallery: z.array(z.string().max(2000)).max(10).default([]),
  cardType: z.enum(["gallery", "string"]).default("gallery"),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sort: z.coerce.number().int().default(0),
});

export const productUpdateSchema = productSchema.partial();

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug: только строчные латинские буквы, цифры и дефис"),
  title: z.string().trim().min(1).max(120),
  sort: z.coerce.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export const categoryUpdateSchema = categorySchema.partial();

export const labelSchema = z.object({
  name: z.string().trim().min(1).max(40),
  imageUrl: z.string().min(1).max(2000),
});

export const userCreateSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(10).max(200),
  role: z.enum(["ADMIN", "EDITOR"]).default("EDITOR"),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  password: z.string().min(10).max(200).optional(),
  role: z.enum(["ADMIN", "EDITOR"]).optional(),
  isActive: z.boolean().optional(),
});

export const settingsSchema = z.object({
  footerCopyright: z.string().max(500).default(""),
  footerAddress: z.string().max(500).default(""),
  footerPhone: z.string().max(100).default(""),
  footerWorkingHours: z.string().max(500).default(""),
  footerLinks: z
    .array(z.object({ label: z.string().max(120), url: z.string().max(2000) }))
    .max(20)
    .default([]),
  footerSocials: z
    .array(z.object({ label: z.string().max(60), url: z.string().max(2000) }))
    .max(20)
    .default([]),
  logoUrl: z.string().max(2000).default(""),
  year: z.string().max(10).default("2026"),
  siteTitle: z.string().max(200).default("KAEF HOOKAH LOUNGE"),
  siteDescription: z.string().max(1000).default(""),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ValidationError(message);
  }
  return result.data;
}

export class ValidationError extends Error {}
