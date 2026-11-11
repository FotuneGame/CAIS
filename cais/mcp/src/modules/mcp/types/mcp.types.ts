import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type Guard = <A>(
  name: string,
  run: (args: A) => Promise<unknown>,
) => (args: A) => Promise<CallToolResult>;

export type ToolGroup = {
  register(server: McpServer, guard: Guard, owner: string): void;
};
