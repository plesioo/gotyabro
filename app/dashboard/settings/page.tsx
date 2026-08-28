import { requireCommunity } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const ctx = await requireCommunity();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight">Settings</h1>
      <p className="mt-0.5 text-sm text-gray-500">
        Manage your community settings.
      </p>
      <div className="mt-6">
        <SettingsForm communityName={ctx.communityName} />
      </div>
    </div>
  );
}
