import type { ToolCall, ToolDefinition } from "./tool.type.js";

export type LlmRole = "system" | "user" | "assistant" | "tool";

export type LlmMessage =
  | {
      role: "system" | "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string | null;
      toolCalls?: ToolCall[];
    }
  | {
      role: "tool";
      content: string;
      toolCallId: string;
      toolName: string;
    };

export type LlmChatInput = {
  messages: LlmMessage[];
  tools? : ToolDefinition[];
};

export type LlmChatOutput = {
  content: string | null;
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
};

export type LlmClient = {
  chat(input: LlmChatInput): Promise<LlmChatOutput>;
};
