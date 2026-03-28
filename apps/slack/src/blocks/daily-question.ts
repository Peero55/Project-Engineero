import type { KnownBlock } from "@slack/types";

export type DailyQuestionBlockPayload = {
  question: { id: string; text: string };
  answers: Array<{ id: string; label: string; text: string }>;
};

/**
 * Build Block Kit for a daily question (adapter-only; no core dependency).
 * Splits answer buttons into multiple action blocks if needed (5 buttons max per block).
 */
export function buildDailyQuestionBlocks(payload: DailyQuestionBlockPayload): KnownBlock[] {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Daily question*\n\n${payload.question.text}`,
      },
    },
  ];

  const maxPerRow = 5;
  for (let i = 0; i < payload.answers.length; i += maxPerRow) {
    const slice = payload.answers.slice(i, i + maxPerRow);
    blocks.push({
      type: "actions",
      block_id: `daily_answers_${i}`,
      elements: slice.map((a) => ({
        type: "button" as const,
        text: {
          type: "plain_text" as const,
          text: buttonCaption(a.label, a.text),
          emoji: true,
        },
        action_id: "answer_daily_question",
        value: JSON.stringify({ q: payload.question.id, o: a.id }),
      })),
    });
  }

  return blocks;
}

/** Slack button plain_text max length is 75. */
function buttonCaption(label: string, optionText: string): string {
  const prefix = `${label}: `;
  const max = 75;
  const rest = max - prefix.length;
  if (rest <= 0) return label.slice(0, max);
  if (optionText.length <= rest) return prefix + optionText;
  return `${prefix}${optionText.slice(0, Math.max(0, rest - 1))}…`;
}

export function buildDailyFeedbackBlocks(params: {
  correct: boolean;
  explanation: string;
  webAppUrl: string;
  slackUserId: string;
  questionId: string;
  /** Domain-safe study URL; falls back to dashboard when omitted */
  studyPath?: { domainSlug: string; topicSlug: string };
}): KnownBlock[] {
  const intro = params.correct ? "Correct." : "Not quite.";
  const explain =
    params.explanation.length > 2800
      ? `${params.explanation.slice(0, 2797)}…`
      : params.explanation;

  const primaryUrl = (() => {
    if (params.studyPath) {
      const u = new URL(
        `/explanations/${encodeURIComponent(params.studyPath.domainSlug)}/${encodeURIComponent(params.studyPath.topicSlug)}`,
        params.webAppUrl
      );
      u.searchParams.set("slack_user_id", params.slackUserId);
      return u;
    }
    const dashboardUrl = new URL("/dashboard", params.webAppUrl);
    dashboardUrl.searchParams.set("slack_user_id", params.slackUserId);
    dashboardUrl.searchParams.set("question_id", params.questionId);
    return dashboardUrl;
  })();

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${intro}*\n\n${explain}`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: params.studyPath ? "Open study page (web)" : "View on dashboard (web)",
            emoji: true,
          },
          url: primaryUrl.toString(),
          action_id: "view_explanation_web",
        },
      ],
    },
  ];
}
