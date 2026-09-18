import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, isRateLimited, recordLoginAttempt, sameOrigin, verifyPassword } from "@/lib/auth";
import { handleApiError, jsonError, readJson } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return jsonError(403, "Проверка Origin не пройдена");
    const { email, password } = schema.parse(await readJson(req));
    if (await isRateLimited(email)) {
      return jsonError(429, "Слишком много попыток входа. Повторите через 15 минут.");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    const ok = user && user.isActive && (await verifyPassword(password, user.passwordHash));
    if (!ok) {
      await recordLoginAttempt(email, req.headers.get("x-forwarded-for") ?? "", false);
      return jsonError(401, "Неверный email или пароль");
    }
    await recordLoginAttempt(email, req.headers.get("x-forwarded-for") ?? "", true);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
