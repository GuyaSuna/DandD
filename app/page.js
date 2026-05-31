import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">DandD</p>
        <h1 className="mt-4 text-4xl font-bold tracking-normal text-zinc-950 sm:text-6xl">
          Crea personajes y preparalos para la campana.
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-700">
          Primera etapa del flujo: catalogos desde base de datos, endpoints App Router y un wizard
          para armar personajes sin valores hardcodeados en el frontend.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Ir al dashboard
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-300 px-5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
