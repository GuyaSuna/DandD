import { getDmCampaign } from "@/lib/dm";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

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

  const combats = await prisma.combat.findMany({
    where: { campaignId: id },
    include: {
      participants: { orderBy: { turnOrder: "asc" } },
      _count: { select: { participants: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return Response.json(combats);
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
    return Response.json({ error: "El nombre del combate es obligatorio." }, { status: 400 });
  }

  const { error } = await getDmCampaign(id, user);

  if (error) {
    return error;
  }

  const combat = await prisma.combat.create({
    data: {
      campaignId: id,
      name,
      createdById: user.id,
    },
    include: {
      participants: { orderBy: { turnOrder: "asc" } },
    },
  });

  return Response.json(combat, { status: 201 });
}
