import { requireCommunity } from "@/lib/auth";
import { listRoles } from "@/lib/queries";
import { RolesManager } from "@/components/RolesManager";

export default async function RolesPage() {
  const ctx = await requireCommunity();
  const roles = await listRoles(ctx.communityId);
  return (
    <div className="mx-auto max-w-4xl">
      <RolesManager roles={roles} />
    </div>
  );
}
