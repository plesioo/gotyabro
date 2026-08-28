import { requireCommunity } from "@/lib/auth";
import { listMembers, listRoles } from "@/lib/queries";
import { MembersTable } from "@/components/MembersTable";

export default async function MembersPage() {
  const ctx = await requireCommunity();
  const [members, roles] = await Promise.all([
    listMembers(ctx.communityId),
    listRoles(ctx.communityId),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <MembersTable members={members} roles={roles} />
    </div>
  );
}
