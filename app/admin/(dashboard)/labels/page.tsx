"use client";

import { useCallback, useEffect, useState } from "react";

interface Label {
  id: string;
  name: string;
  imageUrl: string;
}

export default function LabelsAdminPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [editing, setEditing] = useState<Partial<Label> | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/labels").then((r) => r.json());
    setLabels(d.labels ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setError("");
    const res = await fetch("/api/labels", {
      method: "POST",
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

  const del = async (l: Label) => {
    if (!confirm(`Удалить метку «${l.name}»?`)) return;
    await fetch(`/api/labels/${l.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="admin-card">
      <h1>Метки блюд (NEW, HIT…)</h1>
      {error && <div className="admin-message error">{error}</div>}
      <button className="btn" style={{ marginBottom: 16 }} onClick={() => setEditing({})}>
        + Добавить метку
      </button>
      {editing && (
        <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
          <label className="field">Название (NEW, HIT)
            <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label className="field">URL иконки
            <input value={editing.imageUrl ?? ""} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} placeholder="/api/media/file/..." />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={save}>Сохранить</button>
            <button className="btn" onClick={() => setEditing(null)}>Отмена</button>
          </div>
        </div>
      )}
      <table className="admin-table">
        <thead><tr><th>Иконка</th><th>Название</th><th>URL</th><th></th></tr></thead>
        <tbody>
          {labels.map((l) => (
            <tr key={l.id}>
              <td>{l.imageUrl ? <img className="thumb" src={l.imageUrl} alt={l.name} /> : null}</td>
              <td>{l.name}</td>
              <td style={{ fontSize: 12, wordBreak: "break-all" }}>{l.imageUrl}</td>
              <td><button className="btn btn-sm btn-danger" onClick={() => del(l)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
