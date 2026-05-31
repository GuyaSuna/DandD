"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm({ callbackUrl = "/dashboard" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o password incorrectos.");
      return;
    }

    router.push(result?.url || callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">DandD</p>
      <h1 className="mt-2 text-3xl font-bold">Iniciar sesion</h1>
      <p className="mt-2 text-sm text-zinc-600">Entrá para gestionar personajes y campañas.</p>

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 h-11 w-full rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p className="mt-5 text-center text-sm text-zinc-600">
        No tenes cuenta?{" "}
        <Link href="/register" className="font-semibold text-amber-700">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
