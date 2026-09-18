import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function audit(action: string, entity: string, entityId = "", details = "") {
  const user = await getCurrentUser().catch(() => null);
  await prisma.auditLog.create({
    data: {
      action,
      entity,
      entityId,
      details,
      userId: user?.id ?? null,
      userEmail: user?.email ?? "",
    },
  });
}
