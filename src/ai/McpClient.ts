import type { APIRequestContext, APIResponse } from '@playwright/test';

type RpcBody = {
  jsonrpc: '2.0';
  id: number;
  result?: { content?: Array<{ type: string; text: string }>; isError?: boolean; [k: string]: unknown };
  error?: { code: number; message: string };
};

/** Minimal JSON-RPC 2.0 client for an MCP-style tool server. */
export class McpClient {
  private nextId = 1;

  constructor(
    private readonly request: APIRequestContext,
    private readonly token?: string,
  ) {}

  callRaw(method: string, params?: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post('/mcp', {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      data: { jsonrpc: '2.0', id: this.nextId++, method, params },
    });
  }

  async call(method: string, params?: Record<string, unknown>): Promise<RpcBody> {
    const res = await this.callRaw(method, params);
    if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
    return (await res.json()) as RpcBody;
  }

  callTool(name: string, args: Record<string, unknown>): Promise<RpcBody> {
    return this.call('tools/call', { name, arguments: args });
  }

  /** Tool output is returned as text content; the mock encodes JSON in it. */
  static textOf(body: RpcBody): string {
    return body.result?.content?.[0]?.text ?? '';
  }
}
