import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/app/components/SignOutButton";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [characters, playerCampaigns, dmCampaigns] = await Promise.all([
    prisma.character.findMany({
      where: { playerId: user.id },
      include: { campaign: true, race: true, subrace: true, class: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: {
        characters: { some: { playerId: user.id } },
      },
      include: {
        dungeonMaster: { select: { name: true, email: true } },
        _count: { select: { characters: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { dungeonMasterId: user.id },
      include: { _count: { select: { characters: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold">Hola, {user.name || user.email}</h1>
          <p className="mt-1 text-sm text-zinc-600">{user.role}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/personajes/crear" className="h-10 rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">
            Crear personaje
          </Link>
          <Link href="/campanias/crear" className="h-10 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900">
            Crear campana
          </Link>
          <Link href="/campanias/unirse" className="h-10 rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900">
            Unirse a campana
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Mis personajes">
          {characters.map((character) => (
            <Card key={character.id} href={`/personajes/${character.id}`}>
              <h3 className="font-semibold">{character.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">
                {character.race.name} {character.class.name} nivel {character.level}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase text-amber-700">
                {character.campaign?.name || "Sin campana"}
              </p>
            </Card>
          ))}
          {!characters.length ? <EmptyState text="Todavia no creaste personajes." /> : null}
        </Section>

        <Section title="Campanas donde juego">
          {playerCampaigns.map((campaign) => (
            <Card key={campaign.id} href={`/campanias/${campaign.id}`}>
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">
                DM: {campaign.dungeonMaster?.name || campaign.dungeonMaster?.email}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase text-amber-700">
                {campaign._count.characters} personajes
              </p>
            </Card>
          ))}
          {!playerCampaigns.length ? <EmptyState text="No estas jugando campanas todavia." /> : null}
        </Section>

        <Section title="Campanas que dirijo">
          {dmCampaigns.map((campaign) => (
            <Card key={campaign.id} href={`/dm/campanias/${campaign.id}`}>
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">Codigo: {campaign.inviteCode}</p>
              <p className="mt-2 text-xs font-semibold uppercase text-amber-700">
                {campaign._count.characters} personajes
              </p>
            </Card>
          ))}
          {!dmCampaigns.length ? <EmptyState text="No dirigis campanas todavia." /> : null}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Card({ href, children }) {
  return (
    <Link href={href} className="block rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-amber-700 hover:bg-amber-50">
      {children}
    </Link>
  );
}

function EmptyState({ text }) {
  return <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">{text}</p>;
}
