import { spawnSync } from "node:child_process";

if (process.env.DATABASE_URL_UNPOOLED) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Pull Vercel env before migrating.");
  process.exit(1);
}

const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
