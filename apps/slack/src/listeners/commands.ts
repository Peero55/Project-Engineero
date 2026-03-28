import type { App } from "@slack/bolt";

const WEB_APP_URL = process.env.WEB_APP_URL ?? "http://localhost:3000";

export function registerCommandListeners(app: App): void {
  app.command("/legendary", async ({ command, ack, client }) => {
    await ack();

    const userId = command.user_id;
    const webUrl = `${WEB_APP_URL}?slack_user_id=${userId}`;

    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: userId,
      text: "Legendary Hunts — certification prep via daily quizzes and hunts.",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🏆 Legendary Hunts",
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Gamified certification prep. *Daily quizzes* in Slack, *hunts and battles* on the web.",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "📝 Daily quiz", emoji: true },
              action_id: "start_daily_quiz",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "🗡️ Open web app", emoji: true },
              url: webUrl,
              action_id: "open_web_cmd",
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Open the *App Home* from the sidebar for the full experience.",
            },
          ],
        },
      ],
    });
  });
}
