import type { LlmMessage } from "../types/llm.type.js";

type DbMessageLike = {
  role: string;
  content?: string | null;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: unknown;
};

export function toLlmMessages(messages: DbMessageLike[]): LlmMessage[] {
  return messages
    .filter((message) => {
      return ["system", "user", "assistant", "tool"].includes(message.role);
    })
    .map((message) => {
      if (message.role === "assistant") {
        return {
          role: "assistant",
          content: message.content ?? "",
          toolCalls: Array.isArray(message.toolCalls)
            ? message.toolCalls
            : undefined,
        };
      }

      if (message.role === "tool") {
        return {
          role: "tool",
          content: message.content ?? "",
          toolCallId: message.toolCallId ?? "",
          toolName: message.toolName ?? "",
        };
      }

      return {
        role: message.role as "system" | "user",
        content: message.content ?? "",
      };
    });
}
