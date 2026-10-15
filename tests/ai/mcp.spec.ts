import { expect, test } from '@playwright/test';
import { McpClient } from '../../src/ai/McpClient';

test.describe('MCP-style tool server: protocol', () => {
  test('initialize advertises server info and tool capability', async ({ request }) => {
    const body = await new McpClient(request, 'token-reader').call('initialize', {});
    expect(body.result).toMatchObject({
      serverInfo: { name: 'mock-hotel-tools' },
      capabilities: { tools: {} },
    });
  });

  test('tools/list exposes a JSON schema for every tool', async ({ request }) => {
    const body = await new McpClient(request, 'token-reader').call('tools/list');
    const tools = (body.result?.tools ?? []) as Array<{
      name: string;
      inputSchema: { type: string; required: string[] };
    }>;
    expect(tools.map((t) => t.name).sort()).toEqual(['add_booking_note', 'get_room_availability']);
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.required.length).toBeGreaterThan(0);
    }
  });

  test('tools/list never leaks internal fields such as the required scope', async ({ request }) => {
    const raw = JSON.stringify((await new McpClient(request, 'token-reader').call('tools/list')).result);
    expect(raw).not.toContain('requiredScope');
  });

  test('unknown method returns JSON-RPC -32601', async ({ request }) => {
    const body = await new McpClient(request, 'token-reader').call('does/not/exist');
    expect(body.error?.code).toBe(-32601);
  });
});

test.describe('MCP-style tool server: authentication and permissions', () => {
  test('no token is rejected with 401', async ({ request }) => {
    expect((await new McpClient(request).callRaw('tools/list')).status()).toBe(401);
  });

  test('an unknown token is rejected with 401', async ({ request }) => {
    expect((await new McpClient(request, 'made-up').callRaw('tools/list')).status()).toBe(401);
  });

  test('an expired token is rejected and says why', async ({ request }) => {
    const res = await new McpClient(request, 'token-expired').callRaw('tools/list');
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: 'token_expired' });
  });

  // Permission matrix: who may call which tool.
  const matrix = [
    {
      token: 'token-reader',
      tool: 'get_room_availability',
      args: { date: '2026-12-24', guests: 2 },
      allowed: true,
    },
    {
      token: 'token-reader',
      tool: 'add_booking_note',
      args: { bookingId: 'B-1', note: 'late arrival' },
      allowed: false,
    },
    {
      token: 'token-writer',
      tool: 'get_room_availability',
      args: { date: '2026-12-24', guests: 2 },
      allowed: true,
    },
    {
      token: 'token-writer',
      tool: 'add_booking_note',
      args: { bookingId: 'B-1', note: 'late arrival' },
      allowed: true,
    },
  ];

  for (const { token, tool, args, allowed } of matrix) {
    test(`${token} ${allowed ? 'can' : 'cannot'} call ${tool}`, async ({ request }) => {
      const body = await new McpClient(request, token).callTool(tool, args);
      expect(body.error).toBeUndefined();
      expect(body.result?.isError).toBe(!allowed);
      if (!allowed) expect(McpClient.textOf(body)).toMatch(/missing scope notes:write/);
    });
  }
});

test.describe('MCP-style tool server: tool behaviour', () => {
  test('availability is consistent with the party size', async ({ request }) => {
    const mcp = new McpClient(request, 'token-reader');
    const small = JSON.parse(
      McpClient.textOf(await mcp.callTool('get_room_availability', { date: '2026-12-24', guests: 1 })),
    );
    const large = JSON.parse(
      McpClient.textOf(await mcp.callTool('get_room_availability', { date: '2026-12-24', guests: 6 })),
    );
    expect(small.roomsLeft).toBeGreaterThanOrEqual(large.roomsLeft);
    expect(large.roomsLeft).toBe(0);
  });

  const invalid = [
    { name: 'guests below minimum', args: { date: '2026-12-24', guests: 0 } },
    { name: 'guests above maximum', args: { date: '2026-12-24', guests: 7 } },
    { name: 'guests is not an integer', args: { date: '2026-12-24', guests: 1.5 } },
    { name: 'malformed date', args: { date: '24/12/2026', guests: 2 } },
    { name: 'missing date', args: { guests: 2 } },
  ];

  for (const { name, args } of invalid) {
    test(`rejects invalid params: ${name}`, async ({ request }) => {
      const body = await new McpClient(request, 'token-reader').callTool('get_room_availability', args);
      expect(body.error?.code).toBe(-32602);
    });
  }

  test('rejects a note longer than 200 characters', async ({ request }) => {
    const body = await new McpClient(request, 'token-writer').callTool('add_booking_note', {
      bookingId: 'B-1',
      note: 'x'.repeat(201),
    });
    expect(body.error?.code).toBe(-32602);
  });

  test('unknown tool name returns an invalid-params error', async ({ request }) => {
    const body = await new McpClient(request, 'token-writer').callTool('drop_database', {});
    expect(body.error?.code).toBe(-32602);
    expect(body.error?.message).toMatch(/Unknown tool/);
  });
});
