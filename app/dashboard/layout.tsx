import Link from "next/link";
import { requireCommunity } from "@/lib/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { NavLink } from "@/components/NavLink";
import { MembersIcon, OverviewIcon, RolesIcon } from "@/components/icons";

const ICON_CLASS = "h-4.5 w-4.5 shrink-0";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: <OverviewIcon className={ICON_CLASS} />,
  },
  {
    href: "/dashboard/members",
    label: "Members",
    icon: <MembersIcon className={ICON_CLASS} />,
  },
  {
    href: "/dashboard/roles",
    label: "Roles",
    icon: <RolesIcon className={ICON_CLASS} />,
  },
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
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
            />
          ))}
        </nav>
        <AccountMenu name="Phillip Fleischer" role="Owner" />
      </aside>
      <main className="flex-1 overflow-x-auto p-8">{children}</main>
    </div>
  );
}
