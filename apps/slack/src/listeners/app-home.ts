import type { App } from "@slack/bolt";

const WEB_APP_URL = process.env.WEB_APP_URL ?? "http://localhost:3000";

export function registerAppHomeListeners(app: App): void {
  app.event("app_home_opened", async ({ event, client }) => {
    const userId = event.user;
    const webUrl = `${WEB_APP_URL}?slack_user_id=${userId}`;

    await client.views.publish({
      user_id: userId,
      view: {
        type: "home",
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
              text: "Gamified certification prep for Network+ and beyond. Daily quizzes in Slack, epic hunts and battles on the web.",
            },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "📝 Start daily quiz", emoji: true },
                action_id: "start_daily_quiz",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "🗡️ Open web app", emoji: true },
                url: webUrl,
                action_id: "open_web_hunt_link",
              },
            ],
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Use `/legendary` for quick actions, or the shortcuts menu.",
              },
            ],
          },
        ],
      },
    });
  });
}
