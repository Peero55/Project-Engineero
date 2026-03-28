import { config } from "dotenv";
import path from "node:path";

// Load .env.local from monorepo root; cwd may be apps/slack or project root
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
config({ path: path.resolve(process.cwd(), "../../.env.local"), override: false });

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
