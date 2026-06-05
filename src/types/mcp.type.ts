import { McpResource, McpResourceContent } from "./mcp-resource.type.js";
import type { ToolCall, ToolResult, ToolDefinition } from "./tool.type.js";

export type McpRequestContext = {
  userId?: string;
};

export type McpClient = {
  listTools(context?: McpRequestContext): Promise<ToolDefinition[]>;
  callTool(toolCall: ToolCall): Promise<ToolResult>;
  listResources?(context?: McpRequestContext): Promise<McpResource[]>;
  readResource?(
    uri: string,
    context?: McpRequestContext,
  ): Promise<McpResourceContent[]>;
};
