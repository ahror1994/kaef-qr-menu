import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireUser();
    const take = Math.min(Number(new URL(req.url).searchParams.get("take") ?? 200), 500);
    const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take });
    return NextResponse.json({ logs });
  } catch (err) {
    return handleApiError(err);
  }
}
