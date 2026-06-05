import type { ToolCall, ToolResult, ToolDefinition } from "./tool.type.js";

export type McpClient = {
  listTools(): Promise<ToolDefinition[]>;
  callTool(toolCall: ToolCall): Promise<ToolResult>;
};
