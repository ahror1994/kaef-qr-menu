"use client";

import { useCallback, useEffect, useState } from "react";

interface Log {
  id: string;
  createdAt: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const load = useCallback(async () => {
    const d = await fetch("/api/audit-log?take=300").then((r) => r.json());
    setLogs(d.logs ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-card">
      <h1>Журнал действий</h1>
      <table className="admin-table">
        <thead><tr><th>Время</th><th>Пользователь</th><th>Действие</th><th>Детали</th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td style={{ whiteSpace: "nowrap" }}>{new Date(l.createdAt).toLocaleString("ru-RU")}</td>
              <td>{l.userEmail || "—"}</td>
              <td>{l.action} · {l.entity}</td>
              <td style={{ fontSize: 12 }}>{l.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
