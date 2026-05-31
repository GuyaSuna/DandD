import { prisma } from "@/lib/prisma";
import { forbidden, getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const user = await getCurrentUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      dungeonMaster: { select: { id: true, name: true, email: true } },
      characters: {
        include: {
          player: { select: { id: true, name: true, email: true } },
          race: true,
          subrace: true,
          class: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!campaign) {
    return Response.json({ error: "Campana no encontrada." }, { status: 404 });
  }

  const isDungeonMaster = campaign.dungeonMasterId === user.id || user.role === "ADMIN";
  const isPlayer = campaign.characters.some((character) => character.playerId === user.id);

  if (!isDungeonMaster && !isPlayer) {
    return forbidden("No podes ver una campana donde no participas.");
  }

  return Response.json(campaign);
}
