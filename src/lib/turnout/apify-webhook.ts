import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const ApifyWebhookPayloadSchema = z
  .object({
    eventType: z.string().optional(),
    eventData: z
      .object({
        actorRunId: z.string().min(1).optional(),
      })
      .passthrough()
      .optional(),
    resource: z
      .object({
        id: z.string().min(1).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export interface ParsedApifyWebhook {
  actorRunId: string;
  eventType: string | null;
}

export function authenticateApifyWebhook(
  authorizationHeader: string | null,
  configuredSecret: string | undefined
): boolean {
  if (!configuredSecret || !authorizationHeader?.startsWith("Bearer ")) {
    return false;
  }

  const suppliedSecret = authorizationHeader.slice("Bearer ".length);
  const supplied = Buffer.from(suppliedSecret);
  const expected = Buffer.from(configuredSecret);

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function parseApifyWebhookPayload(raw: unknown): ParsedApifyWebhook {
  const payload = ApifyWebhookPayloadSchema.parse(raw);
  const actorRunId =
    payload.eventData?.actorRunId ?? payload.resource?.id;

  if (!actorRunId) {
    throw new Error("Webhook payload does not contain an actor run ID");
  }

  return {
    actorRunId,
    eventType: payload.eventType ?? null,
  };
}
