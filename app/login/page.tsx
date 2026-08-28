import { redirect } from "next/navigation";
import { getSessionGymId } from "@/lib/session";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  if (await getSessionGymId()) redirect("/dashboard");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">GotYaBro Platform</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to manage your gym community
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
