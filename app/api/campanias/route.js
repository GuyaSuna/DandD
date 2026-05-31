import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

async function generateInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const existingCampaign = await prisma.campaign.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });

    if (!existingCampaign) {
      return code;
    }
  }

  throw new Error("No se pudo generar un codigo unico.");
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      OR: [
        { dungeonMasterId: user.id },
        { characters: { some: { playerId: user.id } } },
      ],
    },
    include: {
      dungeonMaster: { select: { id: true, name: true, email: true } },
      characters: {
        where: { playerId: user.id },
        select: { id: true, name: true, currentHp: true, maxHp: true },
      },
      _count: { select: { characters: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(campaigns);
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  if (user.role !== "DUNGEON_MASTER" && user.role !== "ADMIN") {
    return forbidden("Solo un Dungeon Master puede crear campanas.");
  }

  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return jsonError("El nombre de la campana es obligatorio.");
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: body.description?.trim() || null,
      inviteCode: await generateInviteCode(),
      dungeonMasterId: user.id,
    },
    include: {
      dungeonMaster: { select: { id: true, name: true, email: true } },
      _count: { select: { characters: true } },
    },
  });

  return Response.json(campaign, { status: 201 });
}
