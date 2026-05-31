import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const body = await request.json();
  const inviteCode = body.inviteCode?.trim().toUpperCase();
  const characterId = body.characterId;

  if (!inviteCode || !characterId) {
    return jsonError("inviteCode y characterId son obligatorios.");
  }

  const campaign = await prisma.campaign.findUnique({
    where: { inviteCode },
    select: { id: true, name: true, dungeonMasterId: true },
  });

  if (!campaign) {
    return jsonError("No existe una campana con ese codigo.", 404);
  }

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { id: true, playerId: true, campaignId: true },
  });

  if (!character || character.playerId !== user.id) {
    return jsonError("Solo podes unir personajes propios.", 403);
  }

  if (character.campaignId && character.campaignId !== campaign.id) {
    return jsonError("Ese personaje ya esta asociado a otra campana.");
  }

  const updatedCharacter = await prisma.character.update({
    where: { id: character.id },
    data: { campaignId: campaign.id },
    include: {
      campaign: true,
      race: true,
      subrace: true,
      class: true,
    },
  });

  return Response.json(updatedCharacter);
}
