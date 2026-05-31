import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

async function getDmCharacterContext(characterId, user) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      campaign: { select: { id: true, dungeonMasterId: true } },
    },
  });

  if (!character) {
    return { error: Response.json({ error: "Personaje no encontrado." }, { status: 404 }) };
  }

  if (!character.campaignId || !character.campaign) {
    return { error: Response.json({ error: "El personaje no esta asociado a una campana." }, { status: 400 }) };
  }

  if (character.campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    return { error: forbidden("Solo el DM dueno de la campana puede gestionar notas privadas.") };
  }

  return { character };
}

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const { character, error } = await getDmCharacterContext(id, user);

  if (error) {
    return error;
  }

  const notes = await prisma.characterDMNote.findMany({
    where: {
      characterId: character.id,
      campaignId: character.campaignId,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(notes);
}

export async function POST(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const body = await request.json();
  const content = body.content?.trim();

  if (!content) {
    return Response.json({ error: "El contenido de la nota es obligatorio." }, { status: 400 });
  }

  const { character, error } = await getDmCharacterContext(id, user);

  if (error) {
    return error;
  }

  const note = await prisma.characterDMNote.create({
    data: {
      characterId: character.id,
      campaignId: character.campaignId,
      title: body.title?.trim() || null,
      content,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return Response.json(note, { status: 201 });
}
