import { getDmCombat } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { error } = await getDmCombat(id, user);

  if (error) {
    return error;
  }

  const combat = await prisma.combat.update({
    where: { id },
    data: { status: "FINISHED" },
    include: {
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      participants: { orderBy: { turnOrder: "asc" } },
    },
  });

  return Response.json(combat);
}
