import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import HpManager from "@/app/components/HpManager";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function DungeonMasterCampaignPage({ params }) {
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
          subrace: true,
          class: true,
        },
        orderBy: { createdAt: "asc" },
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
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-amber-700">
            Volver al dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold">{campaign.name}</h1>
          <p className="mt-2 text-sm text-zinc-600">Codigo de invitacion: {campaign.inviteCode}</p>
        </div>
        <Link
          href={`/campanias/${campaign.id}`}
          className="h-10 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900"
        >
          Vista publica
        </Link>
        <Link
          href={`/dm/campanias/${campaign.id}/enemigos`}
          className="h-10 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Enemigos
        </Link>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-bold">Personajes de la campana</h2>
        <HpManager characters={campaign.characters} />
      </section>
    </main>
  );
}
