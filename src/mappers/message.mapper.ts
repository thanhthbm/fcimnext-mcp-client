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
      if (message.role === "tool") {
        return false;
      }

      if (message.role === "assistant" && Array.isArray(message.toolCalls)) {
        return false;
      }

      return ["system", "user", "assistant"].includes(message.role);
    })
    .map((message) => {
      if (message.role === "assistant") {
        return {
          role: "assistant",
          content: message.content ?? "",
        };
      }

      return {
        role: message.role as "system" | "user",
        content: message.content ?? "",
      };
    });
}
