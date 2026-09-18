"use client";

import { useEffect, useState } from "react";

interface FooterLink { label: string; url: string }
interface Settings {
  footerCopyright: string;
  footerAddress: string;
  footerPhone: string;
  footerWorkingHours: string;
  footerLinks: FooterLink[];
  footerSocials: FooterLink[];
  logoUrl: string;
  year: string;
  siteTitle: string;
  siteDescription: string;
}

export default function SettingsAdminPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setS(d.settings));
  }, []);

  if (!s) return <div className="admin-card">Загрузка…</div>;

  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });
  const editList = (key: "footerLinks" | "footerSocials", i: number, patch: Partial<FooterLink>) =>
    set({ [key]: s[key].map((x, xi) => (xi === i ? { ...x, ...patch } : x)) } as Partial<Settings>);

  const save = async () => {
    setError("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка сохранения");
      return;
    }
    setMsg("Настройки сохранены");
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="admin-card">
      <h1>Настройки сайта</h1>
      {error && <div className="admin-message error">{error}</div>}
      {msg && <div className="admin-message ok">{msg}</div>}

      <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
        <h1 style={{ fontSize: 18 }}>Общие</h1>
        <label className="field">Название сайта (title)
          <input value={s.siteTitle} onChange={(e) => set({ siteTitle: e.target.value })} />
        </label>
        <label className="field">Описание (meta description)
          <textarea rows={2} value={s.siteDescription} onChange={(e) => set({ siteDescription: e.target.value })} />
        </label>
        <label className="field">URL логотипа
          <input value={s.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} />
        </label>
      </div>

      <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
        <h1 style={{ fontSize: 18 }}>Футер</h1>
        <label className="field">Копирайт
          <input value={s.footerCopyright} onChange={(e) => set({ footerCopyright: e.target.value })} />
        </label>
        <label className="field">Год
          <input value={s.year} onChange={(e) => set({ year: e.target.value })} />
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label className="field" style={{ flex: 1, minWidth: 180 }}>Адрес
            <input value={s.footerAddress} onChange={(e) => set({ footerAddress: e.target.value })} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 180 }}>Телефон
            <input value={s.footerPhone} onChange={(e) => set({ footerPhone: e.target.value })} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 180 }}>Часы работы
            <input value={s.footerWorkingHours} onChange={(e) => set({ footerWorkingHours: e.target.value })} />
          </label>
        </div>

        <h2 style={{ fontSize: 16, margin: "12px 0 8px" }}>Ссылки</h2>
        {s.footerLinks.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="Название" value={l.label} onChange={(e) => editList("footerLinks", i, { label: e.target.value })} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e2df" }} />
            <input placeholder="https://…" value={l.url} onChange={(e) => editList("footerLinks", i, { url: e.target.value })} style={{ flex: 2, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e2df" }} />
            <button className="btn btn-sm btn-danger" onClick={() => set({ footerLinks: s.footerLinks.filter((_, xi) => xi !== i) })}>✕</button>
          </div>
        ))}
        <button className="btn btn-sm" onClick={() => set({ footerLinks: [...s.footerLinks, { label: "", url: "" }] })}>+ Ссылка</button>

        <h2 style={{ fontSize: 16, margin: "12px 0 8px" }}>Социальные сети</h2>
        {s.footerSocials.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input placeholder="Telegram" value={l.label} onChange={(e) => editList("footerSocials", i, { label: e.target.value })} style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e2df" }} />
            <input placeholder="https://t.me/…" value={l.url} onChange={(e) => editList("footerSocials", i, { url: e.target.value })} style={{ flex: 2, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e2df" }} />
            <button className="btn btn-sm btn-danger" onClick={() => set({ footerSocials: s.footerSocials.filter((_, xi) => xi !== i) })}>✕</button>
          </div>
        ))}
        <button className="btn btn-sm" onClick={() => set({ footerSocials: [...s.footerSocials, { label: "", url: "" }] })}>+ Соцсеть</button>
      </div>

      <button className="btn" onClick={save}>Сохранить настройки</button>
    </div>
  );
}
