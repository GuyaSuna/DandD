import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

function toInt(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

async function getDmCampaign(campaignId, user) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, dungeonMasterId: true },
  });

  if (!campaign) {
    return { error: Response.json({ error: "Campana no encontrada." }, { status: 404 }) };
  }

  if (campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    return { error: forbidden("Solo el DM dueno de la campana puede gestionar enemigos.") };
  }

  return { campaign };
}

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { error } = await getDmCampaign(id, user);

  if (error) {
    return error;
  }

  const enemies = await prisma.enemy.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(enemies);
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return Response.json({ error: "El nombre del enemigo es obligatorio." }, { status: 400 });
  }

  const { error } = await getDmCampaign(id, user);

  if (error) {
    return error;
  }

  const maxHp = Math.max(1, toInt(body.maxHp, 1));
  const currentHp = Math.min(maxHp, Math.max(0, toInt(body.currentHp, maxHp)));

  const enemy = await prisma.enemy.create({
    data: {
      campaignId: id,
      name,
      description: body.description?.trim() || null,
      maxHp,
      currentHp,
      armorClass: Math.max(1, toInt(body.armorClass, 10)),
      strength: toInt(body.strength, 10),
      dexterity: toInt(body.dexterity, 10),
      constitution: toInt(body.constitution, 10),
      intelligence: toInt(body.intelligence, 10),
      wisdom: toInt(body.wisdom, 10),
      charisma: toInt(body.charisma, 10),
      attacks: body.attacks || null,
      notes: body.notes?.trim() || null,
    },
  });

  return Response.json(enemy, { status: 201 });
}
