import { pool } from "./db";
import type { Activity, Insights, MemberWithRoles, Role } from "./types";

export async function listMembers(communityId: string): Promise<MemberWithRoles[]> {
  const { rows } = await pool.query(
    `select m.id,
            m.first_name  as "firstName",
            m.last_name   as "lastName",
            m.email,
            m.phone,
            m.created_at  as "createdAt",
            coalesce(
              json_agg(
                json_build_object('id', r.id, 'name', r.name, 'color', r.color)
                order by r.name
              ) filter (where r.id is not null),
              '[]'
            ) as roles
     from members m
     left join member_roles mr on mr.member_id = m.id
     left join roles r on r.id = mr.role_id
     where m.community_id = $1 and m.status = 'ACTIVE'
     group by m.id
     order by m.created_at desc`,
    [communityId]
  );
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function listRoles(communityId: string): Promise<Role[]> {
  const { rows } = await pool.query(
    `select r.id,
            r.name,
            r.color,
            r.created_at as "createdAt",
            count(m.id) filter (where m.status = 'ACTIVE')::int as "memberCount"
     from roles r
     left join member_roles mr on mr.role_id = r.id
     left join members m on m.id = mr.member_id
     where r.community_id = $1
     group by r.id
     order by r.name`,
    [communityId]
  );
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function listActivity(
  communityId: string,
  limit = 20
): Promise<Activity[]> {
  const { rows } = await pool.query(
    `select id, type, message, created_at as "createdAt"
     from activities
     where community_id = $1
     order by created_at desc
     limit $2`,
    [communityId, limit]
  );
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function getInsights(communityId: string): Promise<Insights> {
  const { rows } = await pool.query(
    `select
       (select count(*)::int from members
        where community_id = $1 and status = 'ACTIVE') as "memberCount",
       (select count(*)::int from roles
        where community_id = $1) as "roleCount",
       (select count(*)::int from members
        where community_id = $1 and status = 'ACTIVE'
          and created_at >= date_trunc('month', now())) as "addedThisMonth"`,
    [communityId]
  );
  return rows[0];
}
