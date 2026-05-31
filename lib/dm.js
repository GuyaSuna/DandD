import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/session";

export async function getDmCampaign(campaignId, user) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, dungeonMasterId: true },
  });

  if (!campaign) {
    return { error: Response.json({ error: "Campana no encontrada." }, { status: 404 }) };
  }

  if (campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    return { error: forbidden("Solo el DM dueno de la campana puede gestionar esto.") };
  }

  return { campaign };
}

export async function getDmCombat(combatId, user, include = {}) {
  const combat = await prisma.combat.findUnique({
    where: { id: combatId },
    include: {
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      ...include,
    },
  });

  if (!combat) {
    return { error: Response.json({ error: "Combate no encontrado." }, { status: 404 }) };
  }

  if (combat.campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    return { error: forbidden("Solo el DM dueno de la campana puede gestionar este combate.") };
  }

  return { combat };
}

export function healthLogType(previousHp, newHp) {
  if (newHp < previousHp) {
    return "DAMAGE";
  }

  if (newHp > previousHp) {
    return "HEAL";
  }

  return "SET";
}

export function clampHp(value, maxHp, fallback = maxHp) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    return fallback;
  }

  return Math.min(maxHp, Math.max(0, number));
}

export async function getManageableCharacter(characterId, user) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
    },
  });

  if (!character) {
    return { error: Response.json({ error: "Personaje no encontrado." }, { status: 404 }) };
  }

  const canManage =
    character.playerId === user.id ||
    character.campaign?.dungeonMasterId === user.id ||
    user.role === "ADMIN";

  if (!canManage) {
    return { error: forbidden("No podes gestionar inventario de un personaje ajeno.") };
  }

  return { character };
}
