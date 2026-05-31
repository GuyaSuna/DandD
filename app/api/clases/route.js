import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const classes = await prisma.characterClass.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json(classes);
}
