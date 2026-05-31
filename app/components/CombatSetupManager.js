"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CombatSetupManager({ campaignId, initialCombats, characters, enemies }) {
  const router = useRouter();
  const [combats, setCombats] = useState(initialCombats);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState({});
  const [initiatives, setInitiatives] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleParticipant(type, id) {
    const key = `${type}:${id}`;
    setSelected((current) => ({ ...current, [key]: !current[key] }));
  }

  async function createCombat(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const selectedParticipants = Object.entries(selected)
        .filter(([, isSelected]) => isSelected)
        .map(([key]) => {
          const [type, id] = key.split(":");
          return {
            type,
            id,
            initiative: Number(initiatives[key] || 0),
          };
        });

      const combatResponse = await fetch(`/api/dm/campanias/${campaignId}/combates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const combat = await combatResponse.json();

      if (!combatResponse.ok) {
        throw new Error(combat.error || "No se pudo crear el combate.");
      }

      if (selectedParticipants.length) {
        const participantsResponse = await fetch(`/api/dm/combates/${combat.id}/participantes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participants: selectedParticipants }),
        });
        const participantsData = await participantsResponse.json();

        if (!participantsResponse.ok) {
          throw new Error(participantsData.error || "No se pudieron guardar los participantes.");
        }
      }

      setCombats((current) => [{ ...combat, _count: { participants: selectedParticipants.length } }, ...current]);
      router.push(`/dm/combates/${combat.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setLoading(false);
    }
  }

  const activeCombats = combats.filter((combat) => combat.status === "ACTIVE");
  const finishedCombats = combats.filter((combat) => combat.status !== "ACTIVE");

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form onSubmit={createCombat} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Crear combate</h2>
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <label className="mt-5 block">
          <span className="text-sm font-medium text-zinc-800">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
          />
        </label>

        <ParticipantPicker
          title="Personajes"
          type="CHARACTER"
          options={characters}
          selected={selected}
          initiatives={initiatives}
          onToggle={toggleParticipant}
          onInitiativeChange={setInitiatives}
        />
        <ParticipantPicker
          title="Enemigos"
          type="ENEMY"
          options={enemies}
          selected={selected}
          initiatives={initiatives}
          onToggle={toggleParticipant}
          onInitiativeChange={setInitiatives}
        />

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="mt-6 h-11 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear combate"}
        </button>
      </form>

      <div className="space-y-6">
        <CombatSection title="Combates activos" combats={activeCombats} />
        <CombatSection title="Combates finalizados" combats={finishedCombats} />
      </div>
    </div>
  );
}

function ParticipantPicker({ title, type, options, selected, initiatives, onToggle, onInitiativeChange }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold uppercase text-zinc-500">{title}</h3>
      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const key = `${type}:${option.id}`;
          return (
            <div key={key} className="grid grid-cols-[1fr_86px] items-center gap-2 rounded-md border border-zinc-200 p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(selected[key])}
                  onChange={() => onToggle(type, option.id)}
                />
                {option.name}
              </label>
              <input
                type="number"
                value={initiatives[key] || ""}
                onChange={(event) =>
                  onInitiativeChange((current) => ({ ...current, [key]: event.target.value }))
                }
                placeholder="Init"
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
              />
            </div>
          );
        })}
        {!options.length ? <p className="text-sm text-zinc-600">Sin opciones disponibles.</p> : null}
      </div>
    </section>
  );
}

function CombatSection({ title, combats }) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-3">
        {combats.map((combat) => (
          <Link
            key={combat.id}
            href={`/dm/combates/${combat.id}`}
            className="block rounded-md border border-zinc-200 bg-zinc-50 p-4 transition hover:border-amber-700 hover:bg-amber-50"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{combat.name}</h3>
              <span className="text-xs font-semibold uppercase text-amber-700">{combat.status}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Ronda {combat.round} - {combat._count?.participants || combat.participants?.length || 0} participantes
            </p>
          </Link>
        ))}
        {!combats.length ? <p className="text-sm text-zinc-600">No hay combates en esta seccion.</p> : null}
      </div>
    </section>
  );
}
