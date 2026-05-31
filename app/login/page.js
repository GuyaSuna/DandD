import LoginForm from "@/app/components/LoginForm";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl || "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
