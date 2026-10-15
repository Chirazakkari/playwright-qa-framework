import type { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';

export const chatReplySchema = z.object({
  reply: z.string().min(1),
  intent: z.enum(['greeting', 'check_in', 'check_out', 'breakfast', 'out_of_scope', 'refused']),
  confidence: z.number().min(0).max(1),
});

export type ChatReply = z.infer<typeof chatReplySchema>;

type AskOptions = {
  sessionId?: string;
  /** Makes the mock model reproducible: the same seed gives the same paraphrase. */
  seed?: number;
  temperature?: 'high';
};

export class ChatClient {
  constructor(private readonly request: APIRequestContext) {}

  askRaw(message: string, options: AskOptions = {}): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (options.seed !== undefined) headers['x-seed'] = String(options.seed);
    if (options.temperature) headers['x-temperature'] = options.temperature;
    return this.request.post('/chat', { headers, data: { message, sessionId: options.sessionId } });
  }

  /** Parses the reply against the contract: a malformed answer fails here, not in an assertion. */
  async ask(message: string, options: AskOptions = {}): Promise<ChatReply> {
    const res = await this.askRaw(message, options);
    if (!res.ok()) throw new Error(`chat failed: ${res.status()}`);
    return chatReplySchema.parse(await res.json());
  }
}
