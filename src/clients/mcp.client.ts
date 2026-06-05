import type { ToolCall, ToolResult } from "../types/tool.type.js";

export const mcpClient = {
  async callTool(toolCall: ToolCall): Promise<ToolResult> {
    if (toolCall.name === "get_current_time") {
      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        content: {
          now: new Date().toISOString(),
          timezone: "UTC",
        },
        isError: false,
      };
    }

    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      content: {
        message: "MCP mock result",
        arguments: toolCall.arguments,
      },
      isError: false,
    };
  },
};
