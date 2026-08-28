import "./env";
import bcrypt from "bcryptjs";
import { pool, withTransaction } from "../lib/db";
import { logActivity } from "../lib/activity";

const ADMIN_EMAIL = "admin@demogym.com";
const ADMIN_PASSWORD = "demo1234";

const ROLES: Array<{ name: string; color: string }> = [
  { name: "Trainer", color: "blue" },
  { name: "Yoga", color: "purple" },
  { name: "Nutrition", color: "green" },
  { name: "VIP", color: "amber" },
];

const MEMBERS: Array<{
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}> = [
  { firstName: "Jane", lastName: "Doe", email: "jane@example.com", roles: ["Trainer", "VIP"] },
  { firstName: "Marcus", lastName: "Webb", email: "marcus@example.com", roles: ["Yoga"] },
  { firstName: "Aisha", lastName: "Khan", email: "aisha@example.com", roles: ["Trainer", "Nutrition"] },
  { firstName: "Tom", lastName: "Berger", email: "tom@example.com", roles: [] },
  { firstName: "Lena", lastName: "Fischer", email: "lena@example.com", roles: ["Yoga", "VIP"] },
  { firstName: "Diego", lastName: "Alvarez", email: "diego@example.com", roles: ["Nutrition"] },
  { firstName: "Sophie", lastName: "Martin", email: "sophie@example.com", roles: ["Yoga"] },
  { firstName: "Ken", lastName: "Tanaka", email: "ken@example.com", roles: ["Trainer"] },
];

async function main() {
  const existing = await pool.query(`select id from gyms where email = $1`, [
    ADMIN_EMAIL,
  ]);
  if (existing.rows.length > 0) {
    console.log(`✔ Already seeded (gym ${ADMIN_EMAIL} exists) — nothing to do.`);
    await pool.end();
    return;
  }

  await withTransaction(async (tx) => {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const gym = await tx.query(
      `insert into gyms (name, email, password_hash) values ($1, $2, $3) returning id`,
      ["Demo Gym", ADMIN_EMAIL, passwordHash]
    );
    const gymId = gym.rows[0].id;

    const community = await tx.query(
      `insert into communities (gym_id, name) values ($1, $2) returning id, name`,
      [gymId, "Downtown Fitness Club"]
    );
    const communityId = community.rows[0].id;
    await logActivity(
      tx,
      communityId,
      "COMMUNITY_CREATED",
      `Community “${community.rows[0].name}” created`
    );

    const roleIdByName = new Map<string, string>();
    for (const role of ROLES) {
      const { rows } = await tx.query(
        `insert into roles (community_id, name, color) values ($1, $2, $3) returning id`,
        [communityId, role.name, role.color]
      );
      roleIdByName.set(role.name, rows[0].id);
      await logActivity(tx, communityId, "ROLE_CREATED", `Created role ${role.name}`, {
        roleId: rows[0].id,
      });
    }

    for (const member of MEMBERS) {
      const { rows } = await tx.query(
        `insert into members (community_id, first_name, last_name, email)
         values ($1, $2, $3, $4) returning id`,
        [communityId, member.firstName, member.lastName, member.email]
      );
      const memberId = rows[0].id;
      await logActivity(
        tx,
        communityId,
        "MEMBER_ADDED",
        `Added member ${member.firstName} ${member.lastName}`,
        { memberId }
      );
      for (const roleName of member.roles) {
        const roleId = roleIdByName.get(roleName)!;
        await tx.query(
          `insert into member_roles (member_id, role_id) values ($1, $2)`,
          [memberId, roleId]
        );
        await logActivity(
          tx,
          communityId,
          "ROLE_ASSIGNED",
          `Assigned role ${roleName} to ${member.firstName} ${member.lastName}`,
          { memberId, roleId }
        );
      }
    }
  });

  console.log("✔ Seeded demo data.");
  console.log(`  Login:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
