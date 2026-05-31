import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

const defaultAttributes = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

function toPositiveInt(value, fallback) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    return fallback;
  }
  return number;
}

export async function GET(request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const requestedPlayerId = searchParams.get("playerId");
  const playerId = requestedPlayerId || user.id;

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        dungeonMasterId: true,
        characters: { where: { playerId: user.id }, select: { id: true } },
      },
    });

    if (!campaign) {
      return Response.json({ error: "Campana no encontrada." }, { status: 404 });
    }

    const isDungeonMaster = campaign.dungeonMasterId === user.id || user.role === "ADMIN";
    const isPlayer = campaign.characters.length > 0;

    if (!isDungeonMaster && !isPlayer) {
      return forbidden("No podes listar personajes de una campana ajena.");
    }

    const characters = await prisma.character.findMany({
      where: {
        campaignId,
        ...(isDungeonMaster && !requestedPlayerId ? {} : { playerId }),
      },
      include: {
        player: { select: { id: true, name: true, email: true, role: true } },
        campaign: { select: { id: true, name: true, dungeonMasterId: true } },
        race: true,
        subrace: true,
        class: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(characters);
  }

  if (playerId !== user.id && user.role !== "ADMIN") {
    return forbidden("No podes listar personajes de otro usuario.");
  }

  const characters = await prisma.character.findMany({
    where: {
      ...(campaignId ? { campaignId } : {}),
      ...(playerId ? { playerId } : {}),
    },
    include: {
      player: { select: { id: true, name: true, email: true, role: true } },
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      race: true,
      subrace: true,
      class: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(characters);
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json();

  if (!body.name || !body.raceId || !body.classId) {
    return jsonError("name, raceId y classId son obligatorios.");
  }

  const characterClass = await prisma.characterClass.findUnique({
    where: { id: body.classId },
  });

  if (!characterClass) {
    return jsonError("La clase seleccionada no existe.", 404);
  }

  const race = await prisma.race.findUnique({
    where: { id: body.raceId },
    include: { subraces: true },
  });

  if (!race) {
    return jsonError("La raza seleccionada no existe.", 404);
  }

  if (body.subraceId && !race.subraces.some((subrace) => subrace.id === body.subraceId)) {
    return jsonError("La subraza seleccionada no pertenece a la raza indicada.");
  }

  const level = toPositiveInt(body.level, 1);
  const maxHp = toPositiveInt(body.maxHp, characterClass.hitDie + 2);

  const character = await prisma.character.create({
    data: {
      name: body.name.trim(),
      level,
      maxHp,
      currentHp: toPositiveInt(body.currentHp, maxHp),
      attributes: body.attributes || defaultAttributes,
      backstory: body.backstory || null,
      traits: body.traits || {},
      inventory: body.inventory || [],
      playerId: user.id,
      campaignId: null,
      raceId: body.raceId,
      subraceId: body.subraceId || null,
      classId: body.classId,
    },
    include: {
      player: { select: { id: true, name: true, email: true, role: true } },
      campaign: { select: { id: true, name: true } },
      race: true,
      subrace: true,
      class: true,
    },
  });

  return Response.json(character, { status: 201 });
}
