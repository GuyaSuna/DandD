"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function CombatTracker({ initialCombat }) {
  const router = useRouter();
  const [combat, setCombat] = useState(initialCombat);
  const [hpDrafts, setHpDrafts] = useState({});
  const [reasons, setReasons] = useState({});
  const [error, setError] = useState("");

  const participants = useMemo(
    () => [...combat.participants].sort((a, b) => a.turnOrder - b.turnOrder),
    [combat.participants]
  );
  const currentParticipant = participants[combat.currentTurnIndex];

  async function updateParticipant(participant) {
    setError("");
    const nextHp =
      hpDrafts[participant.id] === undefined ? participant.currentHp : Number(hpDrafts[participant.id]);

    const response = await fetch(`/api/dm/combates/${combat.id}/participantes/${participant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentHp: nextHp, reason: reasons[participant.id] || "" }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo actualizar el participante.");
      return;
    }

    setCombat((current) => ({
      ...current,
      participants: current.participants.map((row) => (row.id === data.id ? data : row)),
    }));
    setReasons((current) => ({ ...current, [participant.id]: "" }));
  }

  async function deleteParticipant(participantId) {
    setError("");
    const response = await fetch(`/api/dm/combates/${combat.id}/participantes/${participantId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo quitar el participante.");
      return;
    }

    setCombat((current) => ({
      ...current,
      participants: current.participants.filter((participant) => participant.id !== participantId),
      currentTurnIndex: Math.min(current.currentTurnIndex, Math.max(0, current.participants.length - 2)),
    }));
    router.refresh();
  }

  async function nextTurn() {
    setError("");
    const response = await fetch(`/api/dm/combates/${combat.id}/siguiente-turno`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo avanzar el turno.");
      return;
    }

    setCombat(data);
  }

  async function finishCombat() {
    setError("");
    const response = await fetch(`/api/dm/combates/${combat.id}/finalizar`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo finalizar el combate.");
      return;
    }

    setCombat(data);
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">{combat.status}</p>
            <h1 className="mt-2 text-3xl font-bold">{combat.name}</h1>
            <p className="mt-2 text-sm text-zinc-600">Ronda {combat.round}</p>
            <p className="mt-1 text-sm font-semibold">
              Turno actual: {currentParticipant?.name || "Sin participantes"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={nextTurn}
              disabled={combat.status !== "ACTIVE"}
              className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente turno
            </button>
            <button
              type="button"
              onClick={finishCombat}
              disabled={combat.status !== "ACTIVE"}
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Finalizar combate
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-zinc-200 bg-white shadow-sm">
        <div className="divide-y divide-zinc-100">
          {participants.map((participant, index) => (
            <article
              key={participant.id}
              className={`grid gap-4 p-4 lg:grid-cols-[52px_1fr_360px] ${
                index === combat.currentTurnIndex ? "bg-amber-50" : ""
              }`}
            >
              <div className="text-2xl font-bold text-zinc-400">#{participant.turnOrder + 1}</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{participant.name}</h3>
                  <span className="rounded-sm bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-600">
                    {participant.type}
                  </span>
                  {participant.isDefeated ? (
                    <span className="rounded-sm bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                      Derrotado
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  Iniciativa {participant.initiative} - CA {participant.armorClass}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={participant.maxHp}
                    value={hpDrafts[participant.id] ?? participant.currentHp}
                    onChange={(event) =>
                      setHpDrafts((current) => ({ ...current, [participant.id]: event.target.value }))
                    }
                    className="h-10 w-24 rounded-md border border-zinc-300 px-2 text-sm"
                  />
                  <span className="text-sm text-zinc-500">/ {participant.maxHp} HP</span>
                  <button
                    type="button"
                    onClick={() => updateParticipant(participant)}
                    className="h-10 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteParticipant(participant.id)}
                    className="h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700"
                  >
                    Quitar
                  </button>
                </div>
                <input
                  type="text"
                  value={reasons[participant.id] || ""}
                  onChange={(event) => setReasons((current) => ({ ...current, [participant.id]: event.target.value }))}
                  placeholder="Motivo opcional"
                  className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
                />
              </div>
            </article>
          ))}
          {!participants.length ? <p className="p-5 text-sm text-zinc-600">Este combate no tiene participantes.</p> : null}
        </div>
      </section>
    </div>
  );
}
