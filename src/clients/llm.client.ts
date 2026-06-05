import type { LlmClient, LlmMessage } from "../types/llm.type.js";
import { claudeClient } from "./claude.client.js";
import { deepseekClient } from "./deepseek.client.js";
import { openaiClient } from "./openai.client.js";

const mockClient: LlmClient = {
  async chat(input) {
    const lastMessage = [...input.messages].reverse()[0];
    const lastUserContent = getLastUserContent(input.messages);

    const hasToolResult = input.messages.some((message) => {
      return message.role === "tool";
    });

    if (!hasToolResult && lastUserContent.toLowerCase().includes("giờ")) {
      return {
        content: null,
        toolCalls: [
          {
            id: crypto.randomUUID(),
            name: "get_current_time",
            arguments: {},
          },
        ],
        metadata: {
          provider: "mock",
          model: "mock-llm",
          mode: "tool-call",
        },
      };
    }

    if (lastMessage?.role === "tool") {
      return {
        content: `Kết quả tool là: ${lastMessage.content}`,
        metadata: {
          provider: "mock",
          model: "mock-llm",
          mode: "final-answer",
        },
      };
    }

    return {
      content: `LLM mock: ${lastUserContent}. Context có ${input.messages.length} message.`,
      metadata: {
        provider: "mock",
        model: "mock-llm",
      },
    };
  },
};

function getLastUserContent(messages: LlmMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];

    if (message.role === "user") {
      return message.content;
    }
  }

  return "";
}

function createLlmClient(): LlmClient {
  const provider = process.env.LLM_PROVIDER || "mock";

  if (provider === "deepseek") {
    return deepseekClient;
  }

  if (provider === "openai") {
    return openaiClient;
  }

  if (provider === "claude" || provider === "anthropic") {
    return claudeClient;
  }

  return mockClient;
}

export const llmClient = createLlmClient();
