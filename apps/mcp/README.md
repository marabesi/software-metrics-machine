# Software Metrics Machine MCP server

The MCP server exposes Software Metrics Machine data to agent clients over stdio.

```bash
SMM_STORE_DATA_AT=/path/to/smm-data pnpm --filter @smmachine/mcp dev
```

From the main SMM CLI, run:

```bash
SMM_STORE_DATA_AT=/path/to/smm-data smm mcp server start
```

For direct packaged MCP usage, run `smm-mcp` after building or installing the package.
