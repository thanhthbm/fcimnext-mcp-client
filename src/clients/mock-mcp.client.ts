import type { McpClient } from "../types/mcp.type.js";

export const mockMcpClient: McpClient = {
  async listTools() {
    return [
      {
        name: "get_current_time",
        description: "Get the current server time in ISO format.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
      },
    ];
  },

  async callTool(toolCall) {
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
        message: `Unknown mock tool: ${toolCall.name}`,
        arguments: toolCall.arguments,
      },
      isError: true,
    };
  },
};
