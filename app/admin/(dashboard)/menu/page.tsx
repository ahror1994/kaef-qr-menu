"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicProduct } from "@/components/public/MenuSection";

interface Category {
  id: string;
  slug: string;
  title: string;
  sort: number;
  isVisible: boolean;
}
interface Product extends PublicProduct {
  id: string;
  categoryId: string;
  sort: number;
}

const empty = {
  categoryId: "",
  title: "",
  description: "",
  price: 0,
  weight: "",
  imageUrl: "",
  cardType: "gallery" as "gallery" | "string",
  isVisible: true,
  isFeatured: false,
};

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<(Partial<Product> & typeof empty) | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [c, p] = await Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]);
    setCategories(c.categories ?? []);
    setProducts(p.products ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setError("");
    const payload = { ...editing, price: Number(editing.price) || 0 };
    const res = await fetch(editing.id ? `/api/products/${editing.id}` : "/api/products", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка сохранения");
      return;
    }
    setMsg("Сохранено");
    setEditing(null);
    await load();
    setTimeout(() => setMsg(""), 2000);
  };

  const del = async (id: string, title: string) => {
    if (!confirm(`Удалить «${title}»?`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await load();
  };

  const shown = filter === "all" ? products : products.filter((p) => p.categoryId === filter);
  const catTitle = (id: string) => categories.find((c) => c.id === id)?.title ?? "—";

  return (
    <div className="admin-card">
      <h1>Блюда</h1>
      {error && <div className="admin-message error">{error}</div>}
      {msg && <div className="admin-message ok">{msg}</div>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10 }}>
          <option value="all">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button
          className="btn"
          onClick={() => setEditing({ ...empty, categoryId: filter !== "all" ? filter : categories[0]?.id ?? "" })}
        >
          + Добавить блюдо
        </button>
      </div>

      {editing && (
        <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
          <h1 style={{ fontSize: 20 }}>{editing.id ? "Редактирование" : "Новое блюдо"}</h1>
          <label className="field">Категория
            <select
              value={editing.categoryId}
              onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
          <label className="field">Название
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </label>
          <label className="field">Описание
            <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label className="field" style={{ flex: 1, minWidth: 120 }}>Цена, ₽
              <input type="number" min={0} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            </label>
            <label className="field" style={{ flex: 1, minWidth: 120 }}>Вес
              <input placeholder="205 гр." value={editing.weight} onChange={(e) => setEditing({ ...editing, weight: e.target.value })} />
            </label>
            <label className="field" style={{ flex: 2, minWidth: 200 }}>URL изображения
              <input value={editing.imageUrl} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} />
            </label>
          </div>
          <label className="checkbox">
            <input type="checkbox" checked={editing.isVisible} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} />
            Показывать в меню
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={editing.isFeatured} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} />
            Метка NEW
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={editing.cardType === "string"}
              onChange={(e) => setEditing({ ...editing, cardType: e.target.checked ? "string" : "gallery" })}
            />
            Строковая карточка (без картинки)
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={save}>Сохранить</button>
            <button className="btn" onClick={() => setEditing(null)}>Отмена</button>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr><th></th><th>Название</th><th>Категория</th><th>Цена</th><th>Видимость</th><th></th></tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.id}>
              <td>{p.imageUrl ? <img className="thumb" src={p.imageUrl} alt="" /> : null}</td>
              <td>{p.title}</td>
              <td>{catTitle(p.categoryId)}</td>
              <td>{p.price} ₽</td>
              <td>{p.isVisible ? "да" : "нет"}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="btn btn-sm" onClick={() => setEditing({ ...empty, ...p })}>Изменить</button>{" "}
                <button className="btn btn-sm btn-danger" onClick={() => del(p.id, p.title)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
