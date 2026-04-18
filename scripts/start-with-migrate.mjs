import { spawn } from "node:child_process";

const MIGRATION_ATTEMPTS = Number.parseInt(process.env.DB_MIGRATION_ATTEMPTS ?? "20", 10);
const MIGRATION_DELAY_MS = Number.parseInt(process.env.DB_MIGRATION_DELAY_MS ?? "3000", 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function migrateWithRetry() {
  for (let attempt = 1; attempt <= MIGRATION_ATTEMPTS; attempt += 1) {
    try {
      console.log(`[startup] Running database migrations (attempt ${attempt}/${MIGRATION_ATTEMPTS})`);
      await run("npm", ["run", "db:migrate"]);
      console.log("[startup] Database migrations completed");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[startup] Migration attempt ${attempt} failed: ${message}`);

      if (attempt === MIGRATION_ATTEMPTS) {
        throw error;
      }

      await sleep(MIGRATION_DELAY_MS);
    }
  }
}

async function main() {
  await migrateWithRetry();
  console.log("[startup] Starting Next.js server");
  await run("node", ["server.js"]);
}

main().catch((error) => {
  console.error("[startup] Fatal startup error", error);
  process.exit(1);
});
