import { prisma } from "@/lib/db";
import type { SettingsInput } from "@/lib/validation";

export const DEFAULT_SETTINGS: SettingsInput = {
  footerCopyright: "KAEF HOOKAH LOUNGE",
  footerAddress: "",
  footerPhone: "",
  footerWorkingHours: "",
  footerLinks: [],
  footerSocials: [],
  logoUrl: "/source-assets/uploads/2025/04/logo.svg",
  year: "2026",
  siteTitle: "KAEF HOOKAH LOUNGE — QR MENU",
  siteDescription:
    "От фирменных кальянов до изысканных блюд и закусок. Каждая подача — это настроение и стиль.",
};

export async function getSettings(): Promise<SettingsInput> {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const raw = map[key];
    if (raw === undefined) continue;
    const isJson = key === "footerLinks" || key === "footerSocials";
    merged[key] = isJson ? JSON.parse(raw) : raw;
  }
  return merged as SettingsInput;
}

export async function saveSettings(input: SettingsInput) {
  const entries = Object.entries(input).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
  for (const { key, value } of entries) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}
