"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Обзор" },
  { href: "/admin/menu", label: "Блюда" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/media", label: "Медиа" },
  { href: "/admin/labels", label: "Метки" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/import-export", label: "Импорт/Экспорт" },
  { href: "/admin/users", label: "Пользователи", adminOnly: true },
  { href: "/admin/audit-log", label: "Журнал" },
];

export default function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {LINKS.filter((l) => !l.adminOnly || isAdmin).map((l) => (
        <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? "active" : ""}>
          {l.label}
        </Link>
      ))}
    </>
  );
}
