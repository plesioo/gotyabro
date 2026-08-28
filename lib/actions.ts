"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PoolClient } from "pg";
import { z } from "zod";
import { logActivity } from "./activity";
import { requireCommunity, requireGym } from "./auth";
import { pool, withTransaction } from "./db";
import { createSession, destroySession } from "./session";
import type { ActionState } from "./types";
import { ROLE_COLORS } from "./types";

/**
 * Replaces a member's role set with `desiredRoleIds`, diffing against what's
 * currently assigned so only the actual changes get written and logged.
 * Shared by member creation, member editing, and the standalone role-assign
 * popover so all three stay consistent.
 */
async function applyRoleAssignments(
  tx: PoolClient,
  communityId: string,
  memberId: string,
  memberName: string,
  desiredRoleIds: string[]
): Promise<void> {
  // Only roles belonging to this community are assignable.
  const validRoles = await tx.query(
    `select id, name from roles where community_id = $1`,
    [communityId]
  );
  const roleNameById = new Map<string, string>(
    validRoles.rows.map((row) => [row.id, row.name])
  );
  const wanted = new Set(desiredRoleIds.filter((id) => roleNameById.has(id)));

  const current = await tx.query(
    `select role_id from member_roles where member_id = $1`,
    [memberId]
  );
  const existing = new Set<string>(current.rows.map((row) => row.role_id));

  const toAdd = [...wanted].filter((id) => !existing.has(id));
  const toRemove = [...existing].filter((id) => !wanted.has(id));

  for (const roleId of toAdd) {
    await tx.query(
      `insert into member_roles (member_id, role_id) values ($1, $2)`,
      [memberId, roleId]
    );
    await logActivity(
      tx,
      communityId,
      "ROLE_ASSIGNED",
      `Assigned role ${roleNameById.get(roleId)} to ${memberName}`,
      { memberId, roleId }
    );
  }
  for (const roleId of toRemove) {
    await tx.query(
      `delete from member_roles where member_id = $1 and role_id = $2`,
      [memberId, roleId]
    );
    await logActivity(
      tx,
      communityId,
      "ROLE_UNASSIGNED",
      `Unassigned role ${roleNameById.get(roleId)} from ${memberName}`,
      { memberId, roleId }
    );
  }
}

// ---------- auth ----------

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { email, password } = parsed.data;
  const { rows } = await pool.query(
    `select id, password_hash from gyms where email = $1`,
    [email]
  );
  const gym = rows[0];
  if (!gym || !(await bcrypt.compare(password, gym.password_hash))) {
    return { error: "Invalid email or password" };
  }
  await createSession(gym.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ---------- community ----------

const communityNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});

export async function createCommunity(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const gym = await requireGym();
  if (gym.communityId) redirect("/dashboard");
  const parsed = communityNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await withTransaction(async (tx) => {
    const { rows } = await tx.query(
      `insert into communities (gym_id, name) values ($1, $2) returning id`,
      [gym.gymId, parsed.data.name]
    );
    await logActivity(
      tx,
      rows[0].id,
      "COMMUNITY_CREATED",
      `Community “${parsed.data.name}” created`
    );
  });
  redirect("/dashboard");
}

export async function updateCommunityName(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireCommunity();
  const parsed = communityNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const newName = parsed.data.name;
  if (newName === ctx.communityName) return { ok: true };

  await withTransaction(async (tx) => {
    await tx.query(
      `update communities set name = $1, updated_at = now() where id = $2`,
      [newName, ctx.communityId]
    );
    await logActivity(
      tx,
      ctx.communityId,
      "COMMUNITY_RENAMED",
      `Community renamed from “${ctx.communityName}” to “${newName}”`
    );
  });
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// ---------- members ----------

const memberSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
  email: z
    .string()
    .trim()
    .max(120)
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "Invalid email address"
    )
    .transform((value) => value || null),
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((value) => value || null),
});

export async function createMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireCommunity();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { firstName, lastName, email, phone } = parsed.data;
  const roleIds = formData.getAll("roleIds").map(String);

  await withTransaction(async (tx) => {
    const { rows } = await tx.query(
      `insert into members (community_id, first_name, last_name, email, phone)
       values ($1, $2, $3, $4, $5) returning id`,
      [ctx.communityId, firstName, lastName, email, phone]
    );
    const memberId = rows[0].id;
    await logActivity(
      tx,
      ctx.communityId,
      "MEMBER_ADDED",
      `Added member ${firstName} ${lastName}`,
      { memberId }
    );
    if (roleIds.length > 0) {
      await applyRoleAssignments(
        tx,
        ctx.communityId,
        memberId,
        `${firstName} ${lastName}`,
        roleIds
      );
    }
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/roles");
  return { ok: true };
}

export async function updateMember(
  memberId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireCommunity();
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { firstName, lastName, email, phone } = parsed.data;
  const roleIds = formData.getAll("roleIds").map(String);

  await withTransaction(async (tx) => {
    const { rowCount } = await tx.query(
      `update members
       set first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = now()
       where id = $5 and community_id = $6 and status = 'ACTIVE'`,
      [firstName, lastName, email, phone, memberId, ctx.communityId]
    );
    if (rowCount === 0) throw new Error("Member not found");
    await logActivity(
      tx,
      ctx.communityId,
      "MEMBER_UPDATED",
      `Updated member ${firstName} ${lastName}`,
      { memberId }
    );
    await applyRoleAssignments(
      tx,
      ctx.communityId,
      memberId,
      `${firstName} ${lastName}`,
      roleIds
    );
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/roles");
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<void> {
  const ctx = await requireCommunity();
  await withTransaction(async (tx) => {
    const { rows } = await tx.query(
      `update members
       set status = 'REMOVED', removed_at = now(), updated_at = now()
       where id = $1 and community_id = $2 and status = 'ACTIVE'
       returning first_name, last_name`,
      [memberId, ctx.communityId]
    );
    if (rows.length === 0) throw new Error("Member not found");
    await logActivity(
      tx,
      ctx.communityId,
      "MEMBER_REMOVED",
      `Removed member ${rows[0].first_name} ${rows[0].last_name}`,
      { memberId }
    );
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/roles");
}

export async function setMemberRoles(
  memberId: string,
  roleIds: string[]
): Promise<void> {
  const ctx = await requireCommunity();
  await withTransaction(async (tx) => {
    const memberResult = await tx.query(
      `select first_name, last_name from members
       where id = $1 and community_id = $2 and status = 'ACTIVE'`,
      [memberId, ctx.communityId]
    );
    if (memberResult.rows.length === 0) throw new Error("Member not found");
    const memberName = `${memberResult.rows[0].first_name} ${memberResult.rows[0].last_name}`;
    await applyRoleAssignments(tx, ctx.communityId, memberId, memberName, roleIds);
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/roles");
}

// ---------- roles ----------

const roleSchema = z.object({
  name: z.string().trim().min(1, "Role name is required").max(40),
  color: z.enum(ROLE_COLORS),
});

export async function createRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireCommunity();
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, color } = parsed.data;

  try {
    await withTransaction(async (tx) => {
      const { rows } = await tx.query(
        `insert into roles (community_id, name, color) values ($1, $2, $3) returning id`,
        [ctx.communityId, name, color]
      );
      await logActivity(tx, ctx.communityId, "ROLE_CREATED", `Created role ${name}`, {
        roleId: rows[0].id,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return { error: `A role named “${name}” already exists` };
    }
    throw error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/roles");
  return { ok: true };
}

export async function updateRole(
  roleId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ctx = await requireCommunity();
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, color } = parsed.data;

  try {
    await withTransaction(async (tx) => {
      const { rowCount } = await tx.query(
        `update roles set name = $1, color = $2
         where id = $3 and community_id = $4`,
        [name, color, roleId, ctx.communityId]
      );
      if (rowCount === 0) throw new Error("Role not found");
      await logActivity(tx, ctx.communityId, "ROLE_UPDATED", `Updated role ${name}`, {
        roleId,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return { error: `A role named “${name}” already exists` };
    }
    throw error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function deleteRole(roleId: string): Promise<void> {
  const ctx = await requireCommunity();
  await withTransaction(async (tx) => {
    const { rows } = await tx.query(
      `delete from roles where id = $1 and community_id = $2 returning name`,
      [roleId, ctx.communityId]
    );
    if (rows.length === 0) throw new Error("Role not found");
    await logActivity(
      tx,
      ctx.communityId,
      "ROLE_DELETED",
      `Deleted role ${rows[0].name}`,
      { roleId }
    );
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/roles");
  revalidatePath("/dashboard/members");
}
