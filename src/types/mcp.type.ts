import { McpResource, McpResourceContent } from "./mcp-resource.type.js";
import type { ToolCall, ToolResult, ToolDefinition } from "./tool.type.js";

export type McpClient = {
  listTools(): Promise<ToolDefinition[]>;
  callTool(toolCall: ToolCall): Promise<ToolResult>;
  listResources?(): Promise<McpResource[]>;
  readResource?(uri: string): Promise<McpResourceContent[]>;
};
