import { z } from "zod";

const APIFY_API_BASE_URL = "https://api.apify.com/v2";

const ApifyRunSchema = z
  .object({
    id: z.string().min(1),
    actId: z.string().min(1),
    status: z.string().min(1),
    defaultDatasetId: z.string().min(1).nullable().optional(),
    startedAt: z.string().optional(),
    finishedAt: z.string().nullable().optional(),
  })
  .passthrough();

const ApifyRunResponseSchema = z.object({
  data: ApifyRunSchema,
});

export type ApifyRun = z.infer<typeof ApifyRunSchema>;

export interface ApifyProvider {
  getRun(runId: string): Promise<ApifyRun>;
  getDatasetItems(datasetId: string): Promise<unknown[]>;
}

export interface ApifyWebhookConfig {
  requestUrl: string;
  secret: string;
}

export class ApifyClient implements ApifyProvider {
  constructor(
    private readonly token: string,
    private readonly baseUrl = APIFY_API_BASE_URL
  ) {
    if (!token) throw new Error("APIFY_API_TOKEN is not configured");
  }

  async getRun(runId: string): Promise<ApifyRun> {
    const response = await this.request(`/actor-runs/${encodeURIComponent(runId)}`);
    return ApifyRunResponseSchema.parse(response).data;
  }

  async getDatasetItems(datasetId: string): Promise<unknown[]> {
    const response = await this.request(
      `/datasets/${encodeURIComponent(datasetId)}/items?clean=true&format=json`
    );
    if (!Array.isArray(response)) {
      throw new Error("Apify dataset response is not an array");
    }
    return response;
  }

  async startDetailsRun(
    profileUrls: string[],
    webhook?: ApifyWebhookConfig
  ): Promise<ApifyRun> {
    const query = new URLSearchParams({
      maxTotalChargeUsd: "0.25",
    });
    if (webhook) {
      query.set("webhooks", encodeWebhookConfig(webhook));
    }

    const response = await this.request(
      `/actors/apify~instagram-scraper/runs?${query.toString()}`,
      {
        method: "POST",
        body: JSON.stringify({
          resultsType: "details",
          directUrls: profileUrls,
          resultsLimit: 1,
          addProfileStatistics: true,
          searchType: "hashtag",
          addParentData: false,
        }),
      }
    );
    return ApifyRunResponseSchema.parse(response).data;
  }

  async waitForRun(
    runId: string,
    options: { pollIntervalMs?: number; timeoutMs?: number } = {}
  ): Promise<ApifyRun> {
    const pollIntervalMs = options.pollIntervalMs ?? 3_000;
    const timeoutAt = Date.now() + (options.timeoutMs ?? 5 * 60 * 1000);

    while (Date.now() < timeoutAt) {
      const run = await this.getRun(runId);
      if (isTerminalStatus(run.status)) return run;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(`Timed out waiting for Apify run ${runId}`);
  }

  private async request(
    path: string,
    init: { method?: string; body?: string } = {}
  ): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: init.method,
      body: init.body,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Apify API ${response.status}: ${body.slice(0, 500) || response.statusText}`
      );
    }

    return response.json();
  }
}

function encodeWebhookConfig(config: ApifyWebhookConfig): string {
  const payloadTemplate = `{
    "userId": {{userId}},
    "createdAt": {{createdAt}},
    "eventType": {{eventType}},
    "eventData": {{eventData}},
    "resource": {{resource}}
  }`;
  const webhooks = [
    {
      eventTypes: [
        "ACTOR.RUN.SUCCEEDED",
        "ACTOR.RUN.FAILED",
        "ACTOR.RUN.ABORTED",
        "ACTOR.RUN.TIMED_OUT",
      ],
      requestUrl: config.requestUrl,
      payloadTemplate,
      headersTemplate: JSON.stringify({
        Authorization: `Bearer ${config.secret}`,
      }),
    },
  ];
  return Buffer.from(JSON.stringify(webhooks)).toString("base64");
}

function isTerminalStatus(status: string): boolean {
  return ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status);
}
