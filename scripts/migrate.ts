import "./env";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pool } from "../lib/db";

async function main() {
  const sql = readFileSync(resolve(process.cwd(), "lib/schema.sql"), "utf8");
  await pool.query(sql);
  console.log("✔ Schema applied");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
