import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, requireUser, sameOrigin } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { parseBody, userUpdateSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser();
    if (me.role !== "ADMIN") return jsonError(403, "Только ADMIN может изменять пользователей");
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const data = parseBody(userUpdateSchema, await readJson(req));
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.role !== undefined) patch.role = data.role;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.password !== undefined) patch.passwordHash = await hashPassword(data.password);
    const user = await prisma.user.update({
      where: { id: params.id },
      data: patch,
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });
    await audit("update", "user", user.id, user.email);
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const me = await requireUser();
    if (me.role !== "ADMIN") return jsonError(403, "Только ADMIN может удалять пользователей");
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    if (me.id === params.id) return jsonError(400, "Нельзя удалить собственную учётную запись");
    const user = await prisma.user.delete({ where: { id: params.id } });
    await audit("delete", "user", user.id, user.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
