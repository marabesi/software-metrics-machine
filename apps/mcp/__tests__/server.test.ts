import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/server';

describe('MCP server request handling', () => {
  it('responds to initialize with server capabilities', async () => {
    const response = await handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    });

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: '2025-06-18',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'software-metrics-machine',
          version: '0.1.0',
        },
      },
    });
  });

  it('lists read-only SMM tools', async () => {
    const response = await handleRequest({
      jsonrpc: '2.0',
      id: 'tools',
      method: 'tools/list',
      params: {},
    });

    expect(response).toMatchObject({
      jsonrpc: '2.0',
      id: 'tools',
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({ name: 'smm_list_projects' }),
          expect.objectContaining({ name: 'smm_get_pr_metrics' }),
          expect.objectContaining({ name: 'smm_get_full_report' }),
        ]),
      },
    });
  });

  it('returns method-not-found errors for unknown methods', async () => {
    const response = await handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'missing/method',
      params: {},
    });

    expect(response).toEqual({
      jsonrpc: '2.0',
      id: 2,
      error: {
        code: -32601,
        message: 'Method not found: missing/method',
      },
    });
  });
});
