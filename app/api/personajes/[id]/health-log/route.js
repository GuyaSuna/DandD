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
      campaign: { select: { id: true, dungeonMasterId: true } },
    },
  });

  if (!character) {
    return Response.json({ error: "Personaje no encontrado." }, { status: 404 });
  }

  const canView =
    character.playerId === user.id ||
    character.campaign?.dungeonMasterId === user.id ||
    user.role === "ADMIN";

  if (!canView) {
    return forbidden("No podes ver el historial de vida de este personaje.");
  }

  const logs = await prisma.characterHealthLog.findMany({
    where: { characterId: id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(logs);
}
