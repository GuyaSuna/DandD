import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function CampaignPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
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
    notFound();
  }

  const isDungeonMaster = campaign.dungeonMasterId === user.id || user.role === "ADMIN";
  const isPlayer = campaign.characters.some((character) => character.playerId === user.id);

  if (!isDungeonMaster && !isPlayer) {
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
          <p className="mt-2 text-sm text-zinc-600">
            DM: {campaign.dungeonMaster.name || campaign.dungeonMaster.email}
          </p>
        </div>
        {isDungeonMaster ? (
          <Link
            href={`/dm/campanias/${campaign.id}`}
            className="h-10 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Vista DM
          </Link>
        ) : null}
      </header>

      {campaign.description ? (
        <section className="mb-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Descripcion</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{campaign.description}</p>
        </section>
      ) : null}

      <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Personajes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {campaign.characters.map((character) => (
            <article key={character.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="font-semibold">{character.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">
                {character.race.name} {character.class.name} nivel {character.level}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase text-amber-700">
                {character.currentHp}/{character.maxHp} HP
              </p>
            </article>
          ))}
          {!campaign.characters.length ? (
            <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
              Todavia no hay personajes unidos.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
