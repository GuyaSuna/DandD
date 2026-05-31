"use client";

import { useState } from "react";

export default function HpManager({ characters }) {
  const [rows, setRows] = useState(characters);
  const [error, setError] = useState("");

  async function updateHp(characterId, currentHp) {
    setError("");

    const response = await fetch(`/api/personajes/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentHp: Number(currentHp) }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo actualizar la vida.");
      return;
    }

    setRows((currentRows) =>
      currentRows.map((character) => (character.id === data.id ? { ...character, currentHp: data.currentHp } : character))
    );
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="divide-y divide-zinc-100">
        {rows.map((character) => (
          <div key={character.id} className="grid gap-4 p-4 sm:grid-cols-[1fr_180px] sm:items-center">
            <div>
              <h3 className="font-semibold">{character.name}</h3>
              <p className="mt-1 text-sm text-zinc-600">
                {character.player?.name || character.player?.email} - {character.race.name} {character.class.name} nivel {character.level}
              </p>
            </div>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-zinc-500">Vida actual</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={character.maxHp}
                  value={character.currentHp}
                  onChange={(event) =>
                    setRows((currentRows) =>
                      currentRows.map((row) =>
                        row.id === character.id ? { ...row, currentHp: event.target.value } : row
                      )
                    )
                  }
                  className="h-10 w-20 rounded-md border border-zinc-300 px-2 text-sm outline-none transition focus:border-amber-700"
                />
                <span className="text-sm text-zinc-500">/ {character.maxHp}</span>
                <button
                  type="button"
                  onClick={() => updateHp(character.id, character.currentHp)}
                  className="h-10 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white"
                >
                  Guardar
                </button>
              </div>
            </label>
          </div>
        ))}
        {!rows.length ? <div className="p-4 text-sm text-zinc-600">Todavia no hay personajes unidos.</div> : null}
      </div>
    </div>
  );
}
