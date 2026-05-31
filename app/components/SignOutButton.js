"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-white"
    >
      Salir
    </button>
  );
}
