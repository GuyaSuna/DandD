"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "PLAYER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el usuario.");
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">DandD</p>
        <h1 className="mt-2 text-3xl font-bold">Crear cuenta</h1>
        <p className="mt-2 text-sm text-zinc-600">Elegí si vas a jugar o dirigir campañas.</p>

        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <TextInput label="Nombre" value={form.name} onChange={(value) => updateField("name", value)} />
          <TextInput label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
          <TextInput label="Password" type="password" value={form.password} onChange={(value) => updateField("password", value)} />

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Rol</span>
            <select
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-amber-700"
            >
              <option value="PLAYER">Jugador</option>
              <option value="DUNGEON_MASTER">Dungeon Master</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-11 w-full rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creando..." : "Registrarme"}
        </button>

        <p className="mt-5 text-center text-sm text-zinc-600">
          Ya tenes cuenta?{" "}
          <Link href="/login" className="font-semibold text-amber-700">
            Iniciar sesion
          </Link>
        </p>
      </form>
    </main>
  );
}

function TextInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
      />
    </label>
  );
}
