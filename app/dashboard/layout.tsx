import Link from "next/link";
import { requireCommunity } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { NavLink } from "@/components/NavLink";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/roles", label: "Roles" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCommunity();
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <Link href="/dashboard" className="block">
            <span className="text-lg font-bold tracking-tight">GotYaBro Platform</span>
          </Link>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {ctx.communityName}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <p className="truncate px-2 pb-2 text-xs text-gray-400">{ctx.gymName}</p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
