import { config } from "dotenv";
import path from "node:path";

// Load env files: prefer .env.local, fall back to .env, check both cwd and monorepo root
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
config({ path: path.resolve(process.cwd(), "../../.env.local"), override: false });
config({ path: path.resolve(process.cwd(), ".env"), override: false });
config({ path: path.resolve(process.cwd(), "../../.env"), override: false });

import { app, receiver } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

async function main() {
  if (receiver) {
    await receiver.start(PORT);
    console.log(`Legendary Hunts Slack app (OAuth) running on http://localhost:${PORT}`);
    console.log(`Install: http://localhost:${PORT}/slack/install`);
  } else {
    await app.start();
    console.log("Legendary Hunts Slack app (Socket Mode) running");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
