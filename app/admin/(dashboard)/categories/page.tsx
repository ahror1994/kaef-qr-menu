"use client";

import { useCallback, useEffect, useState } from "react";

interface Category {
  id: string;
  slug: string;
  title: string;
  sort: number;
  isVisible: boolean;
  _count?: { products: number };
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/categories").then((r) => r.json());
    setCategories(d.categories ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setError("");
    const res = await fetch(editing.id ? `/api/categories/${editing.id}` : "/api/categories", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка сохранения");
      return;
    }
    setEditing(null);
    await load();
  };

  const del = async (c: Category) => {
    if (!confirm(`Удалить категорию «${c.title}» и все её блюда (${c._count?.products ?? 0})?`)) return;
    await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="admin-card">
      <h1>Категории</h1>
      {error && <div className="admin-message error">{error}</div>}
      <button className="btn" style={{ marginBottom: 16 }} onClick={() => setEditing({ isVisible: true })}>
        + Добавить категорию
      </button>

      {editing && (
        <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
          <label className="field">Название
            <input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </label>
          <label className="field">Slug (адрес-якорь, латиницей)
            <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="osnovnaya" />
          </label>
          <label className="field">Сортировка
            <input type="number" value={editing.sort ?? 0} onChange={(e) => setEditing({ ...editing, sort: Number(e.target.value) })} />
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={editing.isVisible ?? true} onChange={(e) => setEditing({ ...editing, isVisible: e.target.checked })} />
            Показывать
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={save}>Сохранить</button>
            <button className="btn" onClick={() => setEditing(null)}>Отмена</button>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Название</th><th>Slug</th><th>Сорт.</th><th>Блюд</th><th>Видимость</th><th></th></tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.title}</td>
              <td>#{c.slug}</td>
              <td>{c.sort}</td>
              <td>{c._count?.products ?? "—"}</td>
              <td>{c.isVisible ? "да" : "нет"}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="btn btn-sm" onClick={() => setEditing(c)}>Изменить</button>{" "}
                <button className="btn btn-sm btn-danger" onClick={() => del(c)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
