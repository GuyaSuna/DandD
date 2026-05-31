import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CombatSetupManager from "@/app/components/CombatSetupManager";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function CampaignCombatsPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      characters: {
        include: {
          player: { select: { id: true, name: true, email: true } },
          race: true,
          class: true,
        },
        orderBy: { name: "asc" },
      },
      enemies: { orderBy: { name: "asc" } },
      combats: {
        include: {
          participants: { orderBy: { turnOrder: "asc" } },
          _count: { select: { participants: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  if (campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <Link href={`/dm/campanias/${campaign.id}`} className="text-sm font-semibold text-amber-700">
          Volver a la campana
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Combates de {campaign.name}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Crea encuentros, carga iniciativa manual y entra al tracker de turnos.
        </p>
      </header>

      <CombatSetupManager
        campaignId={campaign.id}
        initialCombats={JSON.parse(JSON.stringify(campaign.combats))}
        characters={JSON.parse(JSON.stringify(campaign.characters))}
        enemies={JSON.parse(JSON.stringify(campaign.enemies))}
      />
    </main>
  );
}
