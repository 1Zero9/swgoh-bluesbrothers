import { spawnSync } from "node:child_process";

function runNodeModule(modulePath, args) {
  const result = spawnSync(process.execPath, [modulePath, ...args], {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for a production deployment");
  }

  runNodeModule("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
}

runNodeModule("node_modules/next/dist/bin/next", ["build"]);
