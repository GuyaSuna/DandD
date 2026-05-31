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
  const { combat, error } = await getDmCombat(id, user, {
    participants: { orderBy: { turnOrder: "asc" } },
  });

  if (error) {
    return error;
  }

  if (combat.status !== "ACTIVE") {
    return Response.json({ error: "Solo se puede avanzar un combate activo." }, { status: 400 });
  }

  const participants = combat.participants;
  const activeParticipants = participants.filter((participant) => !participant.isDefeated);

  if (!participants.length || !activeParticipants.length) {
    return Response.json(combat);
  }

  let nextIndex = combat.currentTurnIndex;
  let nextRound = combat.round;

  for (let step = 0; step < participants.length; step += 1) {
    nextIndex += 1;

    if (nextIndex >= participants.length) {
      nextIndex = 0;
      nextRound += 1;
    }

    if (!participants[nextIndex].isDefeated) {
      break;
    }
  }

  const updatedCombat = await prisma.combat.update({
    where: { id },
    data: {
      currentTurnIndex: nextIndex,
      round: nextRound,
    },
    include: {
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      participants: { orderBy: { turnOrder: "asc" } },
    },
  });

  return Response.json(updatedCombat);
}
