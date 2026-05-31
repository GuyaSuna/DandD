import Link from "next/link";
import { redirect } from "next/navigation";
import JoinCampaignForm from "@/app/components/JoinCampaignForm";
import { getCurrentUser } from "@/lib/session";

export default async function JoinCampaignPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/campanias/unirse");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <Link href="/dashboard" className="text-sm font-semibold text-amber-700">
          Volver al dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Unirse a campana</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Ingresá el codigo de invitacion y elegí uno de tus personajes disponibles.
        </p>
      </header>
      <JoinCampaignForm />
    </main>
  );
}
