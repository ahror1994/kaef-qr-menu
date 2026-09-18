"use client";

import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "EDITOR";
  isActive: boolean;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "EDITOR" });

  const load = useCallback(async () => {
    const d = await fetch("/api/users").then((r) => r.json());
    setUsers(d.users ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка");
      return;
    }
    setCreating(false);
    setForm({ email: "", name: "", password: "", role: "EDITOR" });
    setMsg("Пользователь создан");
    await load();
    setTimeout(() => setMsg(""), 2000);
  };

  const patch = async (id: string, data: Partial<User>) => {
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка");
      return;
    }
    await load();
  };

  const del = async (u: User) => {
    if (!confirm(`Удалить пользователя ${u.email}?`)) return;
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка");
      return;
    }
    await load();
  };

  const resetPassword = async (u: User) => {
    const password = prompt(`Новый пароль для ${u.email} (минимум 10 символов):`);
    if (!password) return;
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Ошибка");
    } else setMsg("Пароль обновлён"), setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="admin-card">
      <h1>Пользователи</h1>
      {error && <div className="admin-message error">{error}</div>}
      {msg && <div className="admin-message ok">{msg}</div>}
      <button className="btn" style={{ marginBottom: 16 }} onClick={() => setCreating(!creating)}>
        + Добавить пользователя
      </button>
      {creating && (
        <div className="admin-card" style={{ background: "rgb(var(--background))" }}>
          <label className="field">Email
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">Имя
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">Пароль (мин. 10 символов)
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <label className="field">Роль
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="EDITOR">EDITOR — редактирование меню</option>
              <option value="ADMIN">ADMIN — полный доступ</option>
            </select>
          </label>
          <button className="btn" onClick={create}>Создать</button>
        </div>
      )}
      <table className="admin-table">
        <thead><tr><th>Email</th><th>Имя</th><th>Роль</th><th>Активен</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.name}</td>
              <td>
                <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value as User["role"] })}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="EDITOR">EDITOR</option>
                </select>
              </td>
              <td>
                <input type="checkbox" checked={u.isActive} onChange={(e) => patch(u.id, { isActive: e.target.checked })} />
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                <button className="btn btn-sm" onClick={() => resetPassword(u)}>Сменить пароль</button>{" "}
                <button className="btn btn-sm btn-danger" onClick={() => del(u)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
