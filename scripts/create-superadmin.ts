/**
 * Создаёт/обновляет суперпользователя из переменных окружения
 * SUPERADMIN_EMAIL и SUPERADMIN_PASSWORD.
 * Использование: npm run superadmin
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Задайте SUPERADMIN_EMAIL и SUPERADMIN_PASSWORD в .env");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("SUPERADMIN_PASSWORD должен быть минимум 10 символов");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", isActive: true },
    create: { email, name: "Super Admin", role: "ADMIN", passwordHash },
  });
  console.log(`Готово: ${user.email} (ADMIN)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
