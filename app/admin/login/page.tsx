"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({ error: "Ошибка входа" }));
      setError(data.error ?? "Ошибка входа");
    }
  }

  return (
    <div className="login-box">
      <h1>Вход в админ-панель</h1>
      {error && <div className="admin-message error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label className="field">
          Email
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label className="field">
          Пароль
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
