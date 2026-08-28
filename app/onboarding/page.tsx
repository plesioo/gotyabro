import { redirect } from "next/navigation";
import { requireGym } from "@/lib/auth";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const gym = await requireGym();
  if (gym.communityId) redirect("/dashboard");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {gym.gymName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create your community to get started. Your members will join it
            through the app later.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
