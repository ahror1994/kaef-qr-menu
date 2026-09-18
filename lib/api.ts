import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import { ValidationError } from "@/lib/validation";

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) return jsonError(401, "Не авторизован");
  if (err instanceof ValidationError || err instanceof ZodError) {
    return jsonError(400, err.message);
  }
  console.error(err);
  return jsonError(500, "Внутренняя ошибка сервера");
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("Ожидается JSON-тело запроса");
  }
}
