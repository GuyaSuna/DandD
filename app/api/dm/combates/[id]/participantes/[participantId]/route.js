import { clampHp, getDmCombat, healthLogType } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

async function reorderParticipants(combatId) {
  const participants = await prisma.combatParticipant.findMany({
    where: { combatId },
    orderBy: [{ initiative: "desc" }, { createdAt: "asc" }],
  });

  await prisma.$transaction(
    participants.map((participant, index) =>
      prisma.combatParticipant.update({
        where: { id: participant.id },
        data: { turnOrder: index },
      })
    )
  );
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id, participantId } = await params;
  const body = await request.json();
  const { combat, error } = await getDmCombat(id, user);

  if (error) {
    return error;
  }

  const participant = await prisma.combatParticipant.findUnique({
    where: { id: participantId },
  });

  if (!participant || participant.combatId !== combat.id) {
    return Response.json({ error: "Participante no encontrado." }, { status: 404 });
  }

  const nextHp =
    body.currentHp === undefined
      ? participant.currentHp
      : clampHp(body.currentHp, participant.maxHp, participant.currentHp);
  const nextInitiative =
    body.initiative === undefined ? participant.initiative : Number(body.initiative);

  if (!Number.isInteger(nextInitiative)) {
    return Response.json({ error: "La iniciativa debe ser un numero entero." }, { status: 400 });
  }

  const data = {
    currentHp: nextHp,
    initiative: nextInitiative,
    isDefeated: body.isDefeated === undefined ? nextHp <= 0 : Boolean(body.isDefeated),
  };

  const operations = [
    prisma.combatParticipant.update({
      where: { id: participant.id },
      data,
    }),
  ];

  if (participant.type === "CHARACTER" && participant.characterId && nextHp !== participant.currentHp) {
    operations.push(
      prisma.character.update({
        where: { id: participant.characterId },
        data: { currentHp: nextHp },
      }),
      prisma.characterHealthLog.create({
        data: {
          characterId: participant.characterId,
          campaignId: combat.campaignId,
          amount: Math.abs(nextHp - participant.currentHp),
          previousHp: participant.currentHp,
          newHp: nextHp,
          type: healthLogType(participant.currentHp, nextHp),
          reason: body.reason?.trim() || `Combate: ${combat.name}`,
          createdById: user.id,
        },
      })
    );
  }

  if (participant.type === "ENEMY" && participant.enemyId && nextHp !== participant.currentHp) {
    operations.push(
      prisma.enemy.update({
        where: { id: participant.enemyId },
        data: { currentHp: nextHp },
      })
    );
  }

  const [updatedParticipant] = await prisma.$transaction(operations);

  if (nextInitiative !== participant.initiative) {
    await reorderParticipants(combat.id);
  }

  return Response.json(updatedParticipant);
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id, participantId } = await params;
  const { combat, error } = await getDmCombat(id, user);

  if (error) {
    return error;
  }

  const participant = await prisma.combatParticipant.findUnique({
    where: { id: participantId },
  });

  if (!participant || participant.combatId !== combat.id) {
    return Response.json({ error: "Participante no encontrado." }, { status: 404 });
  }

  await prisma.combatParticipant.delete({ where: { id: participant.id } });
  await reorderParticipants(combat.id);

  return Response.json({ ok: true });
}
