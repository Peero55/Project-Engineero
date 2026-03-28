const jsonHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) h.Authorization = `Bearer ${secret}`;
  return h;
};

function webBaseUrl(): string {
  return process.env.WEB_APP_URL ?? "http://localhost:3000";
}

export type DailyQuestionPayload = {
  question: { id: string; text: string; difficulty: number; topicId: string };
  answers: Array<{ id: string; label: string; text: string }>;
  deliveryDate: string;
};

export type DailyQuestionApiResult =
  | { atQuota: true; message: string }
  | { atQuota: false; data: DailyQuestionPayload };

export async function postNextDailyQuestion(params: {
  platformUserId: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<DailyQuestionApiResult | { error: string; status: number }> {
  const res = await fetch(`${webBaseUrl()}/api/daily-question`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      platformUserId: params.platformUserId,
      platform: "slack",
      displayName: params.displayName,
      avatarUrl: params.avatarUrl,
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return { error: (data.error as string) ?? res.statusText, status: res.status };
  }

  if (data.atQuota === true) {
    return {
      atQuota: true,
      message: (data.message as string) ?? "Daily quota reached.",
    };
  }

  return {
    atQuota: false,
    data: {
      question: data.question as DailyQuestionPayload["question"],
      answers: data.answers as DailyQuestionPayload["answers"],
      deliveryDate: data.deliveryDate as string,
    },
  };
}

export async function postDailyAnswer(params: {
  platformUserId: string;
  questionId: string;
  selectedOptionIds: string[];
  responseMs: number;
  displayName?: string;
}): Promise<
  | {
      correct: boolean;
      explanation: string;
      studyPath?: { domainSlug: string; topicSlug: string };
    }
  | { error: string; status: number }
> {
  const res = await fetch(`${webBaseUrl()}/api/daily-question/answer`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      platformUserId: params.platformUserId,
      platform: "slack",
      questionId: params.questionId,
      selectedOptionIds: params.selectedOptionIds,
      responseMs: params.responseMs,
      displayName: params.displayName,
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return { error: (data.error as string) ?? res.statusText, status: res.status };
  }

  const studyPath = data.studyPath as { domainSlug: string; topicSlug: string } | undefined;

  return {
    correct: data.correct as boolean,
    explanation: (data.explanation as string) ?? "",
    ...(studyPath?.domainSlug && studyPath?.topicSlug ? { studyPath } : {}),
  };
}

export async function postDeliveryMessageTs(params: {
  platformUserId: string;
  questionId: string;
  deliveryDate: string;
  platformMessageTs: string;
  displayName?: string;
}): Promise<void> {
  await fetch(`${webBaseUrl()}/api/daily-question/message-ts`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      platformUserId: params.platformUserId,
      platform: "slack",
      questionId: params.questionId,
      deliveryDate: params.deliveryDate,
      platformMessageTs: params.platformMessageTs,
      displayName: params.displayName,
    }),
  });
}
