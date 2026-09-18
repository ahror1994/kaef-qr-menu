import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [categories, products, visibleProducts, users, media, logs] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.product.count({ where: { isVisible: true } }),
    prisma.user.count(),
    prisma.mediaAsset.count(),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  return (
    <div className="admin-card">
      <h1>Обзор</h1>
      <table className="admin-table">
        <tbody>
          <tr><td>Категории</td><td>{categories}</td></tr>
          <tr><td>Блюда (всего / видимых)</td><td>{products} / {visibleProducts}</td></tr>
          <tr><td>Файлов в медиатеке</td><td>{media}</td></tr>
          <tr><td>Пользователи</td><td>{users}</td></tr>
        </tbody>
      </table>
      <h1 style={{ fontSize: 20, marginTop: 24 }}>Последние действия</h1>
      <table className="admin-table">
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.createdAt).toLocaleString("ru-RU")}</td>
              <td>{l.userEmail || "—"}</td>
              <td>{l.action} {l.entity} {l.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
