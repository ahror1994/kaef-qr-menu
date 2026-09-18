import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword, requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, userCreateSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

export async function GET() {
  try {
    await requireUser();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    if (me.role !== "ADMIN") return jsonError(403, "Только ADMIN может создавать пользователей");
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(userCreateSchema, await readJson(req));
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return jsonError(400, "Пользователь с таким email уже существует");
    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, role: data.role, passwordHash: await hashPassword(data.password) },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    await audit("create", "user", user.id, user.email);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
