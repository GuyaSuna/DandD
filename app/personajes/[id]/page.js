import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function CharacterPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      player: { select: { id: true, name: true, email: true } },
      campaign: { select: { id: true, name: true, dungeonMasterId: true } },
      race: true,
      subrace: true,
      class: true,
      healthLogs: {
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!character) {
    notFound();
  }

  const canView =
    character.playerId === user.id ||
    character.campaign?.dungeonMasterId === user.id ||
    user.role === "ADMIN";

  if (!canView) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <Link href="/dashboard" className="text-sm font-semibold text-amber-700">
          Volver al dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">{character.name}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {character.race.name} {character.subrace ? `(${character.subrace.name})` : ""} - {character.class.name} nivel {character.level}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Ficha rapida</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <SummaryItem label="Vida" value={`${character.currentHp}/${character.maxHp}`} />
            <SummaryItem label="Campana" value={character.campaign?.name || "Sin campana"} />
            <SummaryItem label="Jugador" value={character.player.name || character.player.email} />
          </dl>
        </section>

        <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Historial de vida</h2>
          <div className="mt-4 space-y-3">
            {character.healthLogs.map((log) => (
              <article key={log.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{log.type}</p>
                  <p className="text-sm text-zinc-600">
                    {log.previousHp} {"->"} {log.newHp} ({log.amount})
                  </p>
                </div>
                {log.reason ? <p className="mt-2 text-sm text-zinc-700">{log.reason}</p> : null}
                <p className="mt-2 text-xs text-zinc-500">
                  Por {log.createdBy?.name || log.createdBy?.email || "Sistema"} - {new Date(log.createdAt).toLocaleString("es-UY")}
                </p>
              </article>
            ))}
            {!character.healthLogs.length ? (
              <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                Todavia no hay cambios de vida registrados.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
