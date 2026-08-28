import type { Activity } from "@/lib/types";
import type { ActivityType } from "@/lib/activity";
import { formatRelative } from "@/lib/format";

const TYPE_STYLES: Record<ActivityType, { icon: string; className: string }> = {
  COMMUNITY_CREATED: { icon: "★", className: "bg-amber-100 text-amber-700" },
  COMMUNITY_RENAMED: { icon: "✎", className: "bg-amber-100 text-amber-700" },
  MEMBER_ADDED: { icon: "+", className: "bg-green-100 text-green-700" },
  MEMBER_UPDATED: { icon: "✎", className: "bg-blue-100 text-blue-700" },
  MEMBER_REMOVED: { icon: "−", className: "bg-red-100 text-red-700" },
  ROLE_CREATED: { icon: "+", className: "bg-indigo-100 text-indigo-700" },
  ROLE_UPDATED: { icon: "✎", className: "bg-indigo-100 text-indigo-700" },
  ROLE_DELETED: { icon: "−", className: "bg-red-100 text-red-700" },
  ROLE_ASSIGNED: { icon: "→", className: "bg-purple-100 text-purple-700" },
  ROLE_UNASSIGNED: { icon: "←", className: "bg-gray-100 text-gray-600" },
};

export function ActivityFeed({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-gray-500">
        No activity yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-gray-100">
      {activity.map((item) => {
        const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.MEMBER_UPDATED;
        return (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${style.className}`}
            >
              {style.icon}
            </span>
            <span className="flex-1 text-sm text-gray-800">{item.message}</span>
            <span className="shrink-0 text-xs text-gray-400">
              {formatRelative(item.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
