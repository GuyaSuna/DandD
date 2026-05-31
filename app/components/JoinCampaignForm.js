"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinCampaignForm() {
  const router = useRouter();
  const [characters, setCharacters] = useState([]);
  const [characterId, setCharacterId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const response = await fetch("/api/personajes");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar tus personajes.");
        }

        const availableCharacters = data.filter((character) => !character.campaignId);
        setCharacters(availableCharacters);
        setCharacterId(availableCharacters[0]?.id || "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadCharacters();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setJoining(true);

    try {
      const response = await fetch("/api/campanias/unirse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, characterId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo unir a la campana.");
      }

      router.push(`/campanias/${data.campaignId}`);
      router.refresh();
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return <div className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Cargando personajes...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Codigo de invitacion</span>
          <input
            type="text"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm uppercase outline-none transition focus:border-amber-700"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Personaje</span>
          <select
            value={characterId}
            onChange={(event) => setCharacterId(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-amber-700"
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} - nivel {character.level}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!characters.length ? (
        <p className="mt-4 text-sm text-zinc-600">Necesitas un personaje sin campana para unirte.</p>
      ) : null}

      <button
        type="submit"
        disabled={joining || !inviteCode.trim() || !characterId}
        className="mt-6 h-11 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {joining ? "Uniendo..." : "Unirme"}
      </button>
    </form>
  );
}
