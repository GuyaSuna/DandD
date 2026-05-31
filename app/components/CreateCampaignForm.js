"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateCampaignForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/campanias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la campana.");
      }

      router.push(`/dm/campanias/${data.id}`);
      router.refresh();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setLoading(false);
    }
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
          <span className="text-sm font-medium text-zinc-800">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Descripcion</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-amber-700"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="mt-6 h-11 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear campana"}
      </button>
    </form>
  );
}
