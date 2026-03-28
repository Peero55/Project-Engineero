import type { App } from "@slack/bolt";
import { sendDailyQuestionToUser } from "../services/daily-quiz.js";

const WEB_APP_URL = process.env.WEB_APP_URL ?? "http://localhost:3000";

async function getChannelForShortcut(
  client: App["client"],
  shortcut: { channel?: { id: string }; user: { id: string } }
): Promise<string> {
  if (shortcut.channel?.id) return shortcut.channel.id;
  const dm = await client.conversations.open({ users: shortcut.user.id });
  const channelId = dm.channel?.id;
  if (!channelId) throw new Error("Could not open DM channel");
  return channelId;
}

async function slackDisplayName(client: App["client"], userId: string): Promise<string> {
  const info = await client.users.info({ user: userId });
  const u = info.user;
  if (!u) return "Slack user";
  return (
    u.profile?.display_name?.trim() ||
    u.profile?.real_name?.trim() ||
    u.real_name?.trim() ||
    u.name ||
    "Slack user"
  );
}

export function registerShortcutListeners(app: App): void {
  app.shortcut("start_daily_quiz", async ({ shortcut, ack, client }) => {
    await ack();

    const userId = shortcut.user.id;
    const displayName = await slackDisplayName(client, userId);
    await sendDailyQuestionToUser(client, userId, displayName);
  });

  app.shortcut("open_web_hunt", async ({ shortcut, ack, client }) => {
    await ack();

    const channelId = await getChannelForShortcut(client, shortcut);
    const userId = shortcut.user.id;
    const webUrl = `${WEB_APP_URL}?slack_user_id=${userId}`;

    await client.chat.postEphemeral({
      channel: channelId,
      user: shortcut.user.id,
      text: `Open Legendary Hunts: ${webUrl}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Open Legendary Hunts — start a hunt or battle on the web app.",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Open web app", emoji: true },
              url: webUrl,
              action_id: "open_web_hunt_btn",
            },
          ],
        },
      ],
    });
  });
}
