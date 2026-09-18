"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  size: number;
  createdAt: string;
}

export default function MediaAdminPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const d = await fetch("/api/media").then((r) => r.json());
    setMedia(d.media ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(`${file.name}: ${d.error ?? "ошибка загрузки"}`);
      }
    }
    setMsg("Загрузка завершена");
    await load();
    setTimeout(() => setMsg(""), 2000);
    if (fileRef.current) fileRef.current.value = "";
  };

  const del = async (m: MediaAsset) => {
    if (!confirm(`Удалить ${m.filename}?`)) return;
    await fetch(`/api/media/${m.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="admin-card">
      <h1>Медиатека</h1>
      {error && <div className="admin-message error">{error}</div>}
      {msg && <div className="admin-message ok">{msg}</div>}
      <p style={{ fontSize: 14, color: "rgb(var(--color-description))" }}>
        Скопируйте URL файла и вставьте его в поле «URL изображения» у блюда или в настройках логотипа.
      </p>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginTop: 16 }}>
        {media.map((m) => (
          <div key={m.id} className="admin-card" style={{ margin: 0, padding: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.filename} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8 }} />
            <div style={{ fontSize: 12, margin: "6px 0", wordBreak: "break-all" }}>{m.filename}</div>
            <button
              className="btn btn-sm"
              onClick={() => navigator.clipboard.writeText(location.origin + m.url)}
              title="Скопировать URL"
            >
              Копировать URL
            </button>{" "}
            <button className="btn btn-sm btn-danger" onClick={() => del(m)}>Удалить</button>
          </div>
        ))}
      </div>
    </div>
  );
}
