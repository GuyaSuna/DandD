import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, name: true, email: true, role: true } },
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      race: true,
      subrace: true,
      class: true,
    },
  });

  if (!character) {
    return Response.json({ error: "Personaje no encontrado." }, { status: 404 });
  }

  const canView =
    character.playerId === user.id ||
    user.role === "ADMIN" ||
    character.campaign?.dungeonMasterId === user.id;

  if (!canView) {
    return forbidden("No podes ver un personaje ajeno.");
  }

  return Response.json(character);
}

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, dungeonMasterId: true } },
    },
  });

  if (!character) {
    return Response.json({ error: "Personaje no encontrado." }, { status: 404 });
  }

  const isOwner = character.playerId === user.id;
  const isCampaignDungeonMaster = character.campaign?.dungeonMasterId === user.id;

  if (!isOwner && !isCampaignDungeonMaster && user.role !== "ADMIN") {
    return forbidden("No podes modificar un personaje ajeno.");
  }

  const nextCurrentHp = Number(body.currentHp);

  if (!Number.isInteger(nextCurrentHp) || nextCurrentHp < 0 || nextCurrentHp > character.maxHp) {
    return Response.json({ error: "currentHp debe estar entre 0 y la vida maxima." }, { status: 400 });
  }

  const updatedCharacter = await prisma.character.update({
    where: { id },
    data: { currentHp: nextCurrentHp },
    include: {
      player: { select: { id: true, name: true, email: true, role: true } },
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      race: true,
      subrace: true,
      class: true,
    },
  });

  return Response.json(updatedCharacter);
}
