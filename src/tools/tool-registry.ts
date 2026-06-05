import type { ToolDefinition } from "../types/tool.type.js";

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "get_current_time",
    description: "Get the current time in UTC format.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
];
