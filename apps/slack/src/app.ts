import { App, ExpressReceiver } from "@slack/bolt";
import { FileInstallationStore } from "@slack/oauth";
import path from "node:path";
import { registerAppHomeListeners } from "./listeners/app-home.js";
import { registerShortcutListeners } from "./listeners/shortcuts.js";
import { registerCommandListeners } from "./listeners/commands.js";
import { registerActionListeners } from "./listeners/actions.js";

const useOAuth = !!(
  process.env.SLACK_CLIENT_ID &&
  process.env.SLACK_CLIENT_SECRET &&
  process.env.SLACK_STATE_SECRET
);

const installationStore = new FileInstallationStore({
  baseDir: path.join(process.cwd(), ".slack-installations"),
});

let receiver: ExpressReceiver | undefined;

if (useOAuth) {
  receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    clientId: process.env.SLACK_CLIENT_ID!,
    clientSecret: process.env.SLACK_CLIENT_SECRET!,
    stateSecret: process.env.SLACK_STATE_SECRET!,
    installationStore,
    scopes: ["channels:history", "chat:write", "commands", "im:write", "users:read", "app_mentions:read"],
    redirectUri: process.env.SLACK_REDIRECT_URI,
  });
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  receiver,
  socketMode: !receiver,
  appToken: process.env.SLACK_APP_TOKEN,
});

if (receiver) {
  receiver.init(app);
}

registerAppHomeListeners(app);
registerShortcutListeners(app);
registerCommandListeners(app);
registerActionListeners(app);

export { app, receiver };
