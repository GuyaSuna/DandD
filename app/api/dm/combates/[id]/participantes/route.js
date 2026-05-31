import { getDmCombat } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

async function buildParticipantData(combat, item) {
  const type = item.type;
  const initiative = Number(item.initiative);

  if (!Number.isInteger(initiative)) {
    return { error: "La iniciativa debe ser un numero entero." };
  }

  if (type === "CHARACTER") {
    const character = await prisma.character.findUnique({
      where: { id: item.id },
      select: {
        id: true,
        campaignId: true,
        name: true,
        maxHp: true,
        currentHp: true,
        armorClass: true,
      },
    });

    if (!character || character.campaignId !== combat.campaignId) {
      return { error: "El personaje no pertenece a esta campana." };
    }

    return {
      data: {
        combatId: combat.id,
        characterId: character.id,
        name: character.name,
        type,
        initiative,
        turnOrder: 0,
        maxHp: character.maxHp,
        currentHp: character.currentHp,
        armorClass: character.armorClass,
        isDefeated: character.currentHp <= 0,
      },
    };
  }

  if (type === "ENEMY") {
    const enemy = await prisma.enemy.findUnique({
      where: { id: item.id },
      select: {
        id: true,
        campaignId: true,
        name: true,
        maxHp: true,
        currentHp: true,
        armorClass: true,
      },
    });

    if (!enemy || enemy.campaignId !== combat.campaignId) {
      return { error: "El enemigo no pertenece a esta campana." };
    }

    return {
      data: {
        combatId: combat.id,
        enemyId: enemy.id,
        name: enemy.name,
        type,
        initiative,
        turnOrder: 0,
        maxHp: enemy.maxHp,
        currentHp: enemy.currentHp,
        armorClass: enemy.armorClass,
        isDefeated: enemy.currentHp <= 0,
      },
    };
  }

  return { error: "Tipo de participante invalido." };
}

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

  return prisma.combatParticipant.findMany({
    where: { combatId },
    orderBy: { turnOrder: "asc" },
  });
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const selectedParticipants = Array.isArray(body.participants) ? body.participants : [body];

  if (!selectedParticipants.length) {
    return Response.json({ error: "Selecciona al menos un participante." }, { status: 400 });
  }

  const { combat, error } = await getDmCombat(id, user);

  if (error) {
    return error;
  }

  const prepared = [];

  for (const item of selectedParticipants) {
    const result = await buildParticipantData(combat, item);

    if (result.error) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    prepared.push(result.data);
  }

  await prisma.$transaction(prepared.map((data) => prisma.combatParticipant.create({ data })));
  const participants = await reorderParticipants(combat.id);

  return Response.json(participants, { status: 201 });
}
