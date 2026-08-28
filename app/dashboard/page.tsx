import { requireCommunity } from "@/lib/auth";
import { getInsights, listActivity } from "@/lib/queries";
import { ActivityFeed } from "@/components/ActivityFeed";

export default async function OverviewPage() {
  const ctx = await requireCommunity();
  const [insights, activity] = await Promise.all([
    getInsights(ctx.communityId),
    listActivity(ctx.communityId, 20),
  ]);

  const stats = [
    { label: "Active members", value: insights.memberCount },
    { label: "Roles", value: insights.roleCount },
    { label: "New this month", value: insights.addedThisMonth },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold tracking-tight">Overview</h1>
      <p className="mt-0.5 text-sm text-gray-500">{ctx.communityName}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
        <div className="mt-3 rounded-xl border border-gray-200 bg-white shadow-sm">
          <ActivityFeed activity={activity} />
        </div>
      </div>
    </div>
  );
}
