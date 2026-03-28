import type { App } from "@slack/bolt";
import { buildDailyFeedbackBlocks, buildDailyQuestionBlocks } from "../blocks/daily-question.js";
import { postDailyAnswer, postDeliveryMessageTs, postNextDailyQuestion } from "../lib/daily-api.js";

const WEB_APP_URL = process.env.WEB_APP_URL ?? "http://localhost:3000";

function slackTsToMs(ts: string): number {
  const n = Number(ts);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n * 1000);
}

async function ephemeralToUser(
  client: App["client"],
  slackUserId: string,
  text: string
): Promise<void> {
  const dm = await client.conversations.open({ users: slackUserId });
  const ch = dm.channel?.id;
  if (!ch) return;
  await client.chat.postEphemeral({
    channel: ch,
    user: slackUserId,
    text,
  });
}

/**
 * Fetches the next daily question from the web API and posts it to the user's DM.
 */
export async function sendDailyQuestionToUser(
  client: App["client"],
  slackUserId: string,
  displayName: string
): Promise<void> {
  const result = await postNextDailyQuestion({
    platformUserId: slackUserId,
    displayName,
  });

  if ("error" in result) {
    await ephemeralToUser(client, slackUserId, `Could not load a question: ${result.error}`);
    return;
  }

  if (result.atQuota) {
    await ephemeralToUser(client, slackUserId, result.message);
    return;
  }

  const { data } = result;
  const blocks = buildDailyQuestionBlocks({
    question: { id: data.question.id, text: data.question.text },
    answers: data.answers,
  });

  const dm = await client.conversations.open({ users: slackUserId });
  const channelId = dm.channel?.id;
  if (!channelId) return;

  const posted = await client.chat.postMessage({
    channel: channelId,
    text: "Daily question",
    blocks,
  });

  if (posted.ts) {
    await postDeliveryMessageTs({
      platformUserId: slackUserId,
      questionId: data.question.id,
      deliveryDate: data.deliveryDate,
      platformMessageTs: posted.ts,
      displayName,
    });
  }
}

export async function handleDailyAnswer(params: {
  client: App["client"];
  slackUserId: string;
  channelId: string;
  messageTs: string;
  questionId: string;
  optionId: string;
  displayName: string;
}): Promise<void> {
  const { client, slackUserId, channelId, messageTs, questionId, optionId, displayName } = params;

  const responseMs = Math.max(0, Date.now() - slackTsToMs(messageTs));

  const result = await postDailyAnswer({
    platformUserId: slackUserId,
    questionId,
    selectedOptionIds: [optionId],
    responseMs,
    displayName,
  });

  if ("error" in result) {
    await ephemeralToUser(
      client,
      slackUserId,
      result.status === 400
        ? "That question was already answered or is no longer valid."
        : `Something went wrong: ${result.error}`
    );
    return;
  }

  const feedback = buildDailyFeedbackBlocks({
    correct: result.correct,
    explanation: result.explanation,
    webAppUrl: WEB_APP_URL,
    slackUserId,
    questionId,
    studyPath: "studyPath" in result ? result.studyPath : undefined,
  });

  await client.chat.update({
    channel: channelId,
    ts: messageTs,
    text: result.correct ? "Correct!" : "Incorrect",
    blocks: feedback,
  });
}
