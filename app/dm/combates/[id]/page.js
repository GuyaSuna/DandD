import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CombatTracker from "@/app/components/CombatTracker";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function CombatPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const combat = await prisma.combat.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      participants: { orderBy: { turnOrder: "asc" } },
    },
  });

  if (!combat) {
    notFound();
  }

  if (combat.campaign.dungeonMasterId !== user.id && user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <Link href={`/dm/campanias/${combat.campaignId}/combates`} className="text-sm font-semibold text-amber-700">
          Volver a combates
        </Link>
      </header>

      <CombatTracker initialCombat={JSON.parse(JSON.stringify(combat))} />
    </main>
  );
}
