import { redirect } from "next/navigation";
import { pool } from "./db";
import { getSessionGymId } from "./session";

export type CommunityContext = {
  gymId: string;
  gymName: string;
  communityId: string;
  communityName: string;
};

type GymRow = {
  gym_id: string;
  gym_name: string;
  community_id: string | null;
  community_name: string | null;
};

async function loadGymWithCommunity(): Promise<GymRow | null> {
  const gymId = await getSessionGymId();
  if (!gymId) return null;
  const { rows } = await pool.query<GymRow>(
    `select g.id as gym_id, g.name as gym_name,
            c.id as community_id, c.name as community_name
     from gyms g
     left join communities c on c.gym_id = g.id
     where g.id = $1`,
    [gymId]
  );
  return rows[0] ?? null;
}

/** Logged-in gym or redirect to /login. Used by onboarding, where no community exists yet. */
export async function requireGym(): Promise<{ gymId: string; gymName: string; communityId: string | null }> {
  const row = await loadGymWithCommunity();
  if (!row) redirect("/login");
  return { gymId: row.gym_id, gymName: row.gym_name, communityId: row.community_id };
}

/**
 * The tenant-isolation boundary: every data-touching page and action resolves
 * the community from the session (never from client input) through this helper.
 */
export async function requireCommunity(): Promise<CommunityContext> {
  const row = await loadGymWithCommunity();
  if (!row) redirect("/login");
  if (!row.community_id || !row.community_name) redirect("/onboarding");
  return {
    gymId: row.gym_id,
    gymName: row.gym_name,
    communityId: row.community_id,
    communityName: row.community_name,
  };
}
