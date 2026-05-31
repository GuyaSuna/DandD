import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const races = await prisma.race.findMany({
    include: {
      subraces: {
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(races);
}
