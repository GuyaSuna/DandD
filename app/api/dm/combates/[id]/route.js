import { getDmCombat } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

const combatInclude = {
  participants: { orderBy: { turnOrder: "asc" } },
  campaign: { select: { id: true, name: true, dungeonMasterId: true } },
};

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { combat, error } = await getDmCombat(id, user, {
    participants: { orderBy: { turnOrder: "asc" } },
  });

  if (error) {
    return error;
  }

  return Response.json(combat);
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const { error } = await getDmCombat(id, user);

  if (error) {
    return error;
  }

  const allowedStatuses = ["ACTIVE", "FINISHED", "CANCELLED"];
  const data = {
    ...(body.name !== undefined ? { name: body.name.trim() } : {}),
    ...(allowedStatuses.includes(body.status) ? { status: body.status } : {}),
  };

  const combat = await prisma.combat.update({
    where: { id },
    data,
    include: combatInclude,
  });

  return Response.json(combat);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { error } = await getDmCombat(id, user);

  if (error) {
    return error;
  }

  await prisma.combat.delete({ where: { id } });

  return Response.json({ ok: true });
}
