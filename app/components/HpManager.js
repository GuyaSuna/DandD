"use client";

import { useState } from "react";
import Link from "next/link";
import InventoryManager from "@/app/components/InventoryManager";

export default function HpManager({ characters }) {
  const [rows, setRows] = useState(characters);
  const [expandedId, setExpandedId] = useState("");
  const [error, setError] = useState("");
  const [reasons, setReasons] = useState({});
  const [logs, setLogs] = useState({});
  const [notes, setNotes] = useState({});
  const [noteForms, setNoteForms] = useState({});

  async function loadDetails(characterId) {
    const [logsResponse, notesResponse] = await Promise.all([
      fetch(`/api/personajes/${characterId}/health-log`),
      fetch(`/api/dm/personajes/${characterId}/notas`),
    ]);
    const [logsData, notesData] = await Promise.all([logsResponse.json(), notesResponse.json()]);

    if (logsResponse.ok) {
      setLogs((current) => ({ ...current, [characterId]: logsData }));
    }

    if (notesResponse.ok) {
      setNotes((current) => ({ ...current, [characterId]: notesData }));
    }
  }

  async function toggleDetails(characterId) {
    const nextExpandedId = expandedId === characterId ? "" : characterId;
    setExpandedId(nextExpandedId);

    if (nextExpandedId && (!logs[characterId] || !notes[characterId])) {
      await loadDetails(characterId);
    }
  }

  async function updateHp(characterId, currentHp) {
    setError("");

    const response = await fetch(`/api/personajes/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentHp: Number(currentHp), reason: reasons[characterId] || "" }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo actualizar la vida.");
      return;
    }

    setRows((currentRows) =>
      currentRows.map((character) => (character.id === data.id ? { ...character, currentHp: data.currentHp } : character))
    );
    setReasons((current) => ({ ...current, [characterId]: "" }));
    await loadDetails(characterId);
  }

  async function createNote(characterId) {
    setError("");
    const form = noteForms[characterId] || {};

    const response = await fetch(`/api/dm/personajes/${characterId}/notas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title || "", content: form.content || "" }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo crear la nota.");
      return;
    }

    setNoteForms((current) => ({ ...current, [characterId]: { title: "", content: "" } }));
    await loadDetails(characterId);
  }

  async function deleteNote(characterId, noteId) {
    setError("");
    const response = await fetch(`/api/dm/notas/${noteId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo eliminar la nota.");
      return;
    }

    await loadDetails(characterId);
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm">
      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="divide-y divide-zinc-100">
        {rows.map((character) => (
          <div key={character.id} className="p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_340px] sm:items-start">
              <div>
                <h3 className="font-semibold">{character.name}</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {character.player?.name || character.player?.email} - {character.race.name} {character.class.name} nivel {character.level}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleDetails(character.id)}
                    className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold text-zinc-900"
                  >
                    {expandedId === character.id ? "Ocultar detalles" : "Ver historial, notas e inventario"}
                  </button>
                  <Link
                    href={`/personajes/${character.id}`}
                    className="h-9 rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-900"
                  >
                    Ficha
                  </Link>
                </div>
              </div>
              <div className="space-y-2">
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
                <input
                  type="text"
                  value={reasons[character.id] || ""}
                  onChange={(event) => setReasons((current) => ({ ...current, [character.id]: event.target.value }))}
                  placeholder="Motivo opcional"
                  className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
                />
              </div>
            </div>

            {expandedId === character.id ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                  <h4 className="font-semibold">Historial de vida</h4>
                  <HealthLogList logs={logs[character.id] || []} />
                </section>
                <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                  <h4 className="font-semibold">Notas privadas</h4>
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      value={noteForms[character.id]?.title || ""}
                      onChange={(event) =>
                        setNoteForms((current) => ({
                          ...current,
                          [character.id]: { ...current[character.id], title: event.target.value },
                        }))
                      }
                      placeholder="Titulo opcional"
                      className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
                    />
                    <textarea
                      value={noteForms[character.id]?.content || ""}
                      onChange={(event) =>
                        setNoteForms((current) => ({
                          ...current,
                          [character.id]: { ...current[character.id], content: event.target.value },
                        }))
                      }
                      placeholder="Nota privada"
                      rows={3}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-amber-700"
                    />
                    <button
                      type="button"
                      onClick={() => createNote(character.id)}
                      className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white"
                    >
                      Agregar nota
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {(notes[character.id] || []).map((note) => (
                      <article key={note.id} className="rounded-md border border-zinc-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-sm font-semibold">{note.title || "Sin titulo"}</h5>
                            <p className="mt-1 text-sm text-zinc-700">{note.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteNote(character.id, note.id)}
                            className="text-sm font-semibold text-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    ))}
                    {!(notes[character.id] || []).length ? <p className="text-sm text-zinc-600">Sin notas privadas.</p> : null}
                  </div>
                </section>
                <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4 lg:col-span-2">
                  <h4 className="mb-3 font-semibold">Inventario</h4>
                  <InventoryManager characterId={character.id} compact />
                </section>
              </div>
            ) : null}
          </div>
        ))}
        {!rows.length ? <div className="p-4 text-sm text-zinc-600">Todavia no hay personajes unidos.</div> : null}
      </div>
    </div>
  );
}

function HealthLogList({ logs }) {
  if (!logs.length) {
    return <p className="mt-3 text-sm text-zinc-600">Sin movimientos de vida.</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-md border border-zinc-200 bg-white p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{log.type}</span>
            <span className="text-zinc-500">
              {log.previousHp} {"->"} {log.newHp}
            </span>
          </div>
          {log.reason ? <p className="mt-1 text-zinc-600">{log.reason}</p> : null}
        </div>
      ))}
    </div>
  );
}
