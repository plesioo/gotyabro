import type { PoolClient } from "pg";

export const ACTIVITY_TYPES = [
  "COMMUNITY_CREATED",
  "COMMUNITY_RENAMED",
  "MEMBER_ADDED",
  "MEMBER_UPDATED",
  "MEMBER_REMOVED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "ROLE_ASSIGNED",
  "ROLE_UNASSIGNED",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * Called explicitly from each mutating server action, inside the same
 * transaction as the primary write, so mutation + activity stay consistent.
 */
export async function logActivity(
  client: PoolClient,
  communityId: string,
  type: ActivityType,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await client.query(
    `insert into activities (community_id, type, message, metadata)
     values ($1, $2, $3, $4)`,
    [communityId, type, message, metadata ?? null]
  );
}
