"use client";

import { useRef, useState } from "react";

export default function ImportExportPage() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const doImport = async () => {
    setError("");
    setMsg("");
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Выберите JSON-файл");
      return;
    }
    const text = await file.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      setError("Файл не является корректным JSON");
      return;
    }
    const mode = confirm("OK — заменить всё меню, Отмена — объединить с текущим") ? "replace" : "merge";
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(json as object), mode }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(d.error ?? "Ошибка импорта");
      return;
    }
    setMsg(`Импорт завершён: создано ${d.created}, обновлено ${d.updated} (режим: ${d.mode === "replace" ? "замена" : "объединение"})`);
  };

  return (
    <div className="admin-card">
      <h1>Импорт / Экспорт</h1>

      <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Экспорт</h2>
        <p style={{ fontSize: 14 }}>Полная выгрузка меню, категорий, меток и настроек в JSON.</p>
        <a className="btn" href="/api/export" download>Скачать JSON</a>
      </div>

      <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Импорт</h2>
        {error && <div className="admin-message error">{error}</div>}
        {msg && <div className="admin-message ok">{msg}</div>}
        <p style={{ fontSize: 14 }}>
          Поддерживается формат экспорта этого приложения и формат исходного сайта (data/source-menu.json).
          Перед импортом спросят режим: объединение или полная замена меню.
        </p>
        <input ref={fileRef} type="file" accept="application/json" />{" "}
        <button className="btn" onClick={doImport}>Импортировать</button>
      </div>
    </div>
  );
}
