import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EnemyManager from "@/app/components/EnemyManager";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function CampaignEnemiesPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      enemies: { orderBy: { createdAt: "desc" } },
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
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/dm/campanias/${campaign.id}`} className="text-sm font-semibold text-amber-700">
            Volver a la campana
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Enemigos de {campaign.name}</h1>
        </div>
      </header>
      <EnemyManager campaignId={campaign.id} initialEnemies={JSON.parse(JSON.stringify(campaign.enemies))} />
    </main>
  );
}
