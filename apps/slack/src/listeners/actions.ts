import type { App } from "@slack/bolt";
import { handleDailyAnswer, sendDailyQuestionToUser } from "../services/daily-quiz.js";

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

export function registerActionListeners(app: App): void {
  app.action("start_daily_quiz", async ({ ack, body, client }) => {
    await ack();

    const userId = "user" in body ? body.user?.id : undefined;
    if (!userId) return;

    const displayName = await slackDisplayName(client, userId);
    await sendDailyQuestionToUser(client, userId, displayName);
  });

  app.action("answer_daily_question", async ({ ack, body, client }) => {
    await ack();

    if (body.type !== "block_actions") return;

    const userId = body.user?.id;
    const channelId = body.channel?.id;
    const messageTs = body.message?.ts;
    const action = body.actions?.[0];

    if (!userId || !channelId || !messageTs || !action || action.type !== "button" || !action.value) {
      return;
    }

    let parsed: { q?: string; o?: string };
    try {
      parsed = JSON.parse(action.value) as { q?: string; o?: string };
    } catch {
      return;
    }

    const questionId = parsed.q;
    const optionId = parsed.o;
    if (!questionId || !optionId) return;

    const displayName = await slackDisplayName(client, userId);

    await handleDailyAnswer({
      client,
      slackUserId: userId,
      channelId,
      messageTs,
      questionId,
      optionId,
      displayName,
    });
  });
}
