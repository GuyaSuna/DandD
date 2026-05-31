import Link from "next/link";
import { redirect } from "next/navigation";
import CreateCampaignForm from "@/app/components/CreateCampaignForm";
import { getCurrentUser } from "@/lib/session";

export default async function CreateCampaignPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/campanias/crear");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-zinc-200 pb-6">
        <Link href="/dashboard" className="text-sm font-semibold text-amber-700">
          Volver al dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Crear campana</h1>
        <p className="mt-2 text-sm text-zinc-600">
          El Dungeon Master se toma desde tu sesion y el codigo de invitacion se genera automaticamente.
        </p>
      </header>
      <CreateCampaignForm />
    </main>
  );
}
