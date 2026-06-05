import OpenAI from "openai";

import { LlmError } from "../errors/llm-error.js";
import type {
  LlmChatInput,
  LlmChatOutput,
  LlmClient,
  LlmMessage,
} from "../types/llm.type.js";
import type { ToolCall, ToolDefinition } from "../types/tool.type.js";

const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY || "missing-key",
});

export const deepseekClient: LlmClient = {
  async chat(input: LlmChatInput): Promise<LlmChatOutput> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new LlmError({
        provider: "deepseek",
        message: "Missing DEEPSEEK_API_KEY",
        statusCode: 500,
      });
    }

    const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

    try {
      const response = await deepseek.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Answer in Vietnamese.",
          },
          ...input.messages.map(toOpenAiMessage),
        ],
        tools: input.tools?.map(toOpenAiTool),
        tool_choice: input.tools?.length ? "auto" : undefined,
      });

      const responseMessage = response.choices[0]?.message;

      const toolCalls = responseMessage?.tool_calls
        ?.filter(isFunctionToolCall)
        .map((toolCall) => {
          return {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: safeParseJsonObject(toolCall.function.arguments),
          } satisfies ToolCall;
        });

      return {
        content: responseMessage?.content ?? null,
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        metadata: {
          provider: "deepseek",
          model,
          usage: response.usage,
          finishReason: response.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      throw normalizeDeepSeekError(error);
    }
  },
};

function toOpenAiMessage(message: LlmMessage) {
  if (message.role === "tool") {
    return {
      role: "tool" as const,
      tool_call_id: message.toolCallId,
      content: message.content,
    };
  }

  if (message.role === "assistant") {
    if (message.toolCalls?.length) {
      return {
        role: "assistant" as const,
        content: message.content ?? null,
        tool_calls: message.toolCalls.map((toolCall) => ({
          id: toolCall.id,
          type: "function" as const,
          function: {
            name: toolCall.name,
            arguments: JSON.stringify(toolCall.arguments),
          },
        })),
      };
    }

    return {
      role: "assistant" as const,
      content: message.content ?? "",
    };
  }

  return {
    role: message.role,
    content: message.content,
  };
}

function toOpenAiTool(tool: ToolDefinition) {
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  };
}

function safeParseJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return {};
  } catch {
    return {};
  }
}

function normalizeDeepSeekError(error: unknown): LlmError {
  if (error instanceof OpenAI.APIError) {
    return new LlmError({
      provider: "deepseek",
      message: error.message || "DeepSeek API error",
      statusCode: mapProviderStatusToHttpStatus(error.status),
      details: {
        status: error.status,
        code: error.code,
        type: error.type,
        requestId: error.requestID,
      },
    });
  }

  return new LlmError({
    provider: "deepseek",
    message: "Failed to call DeepSeek API",
    statusCode: 502,
    details: error instanceof Error ? error.message : error,
  });
}

function mapProviderStatusToHttpStatus(status: number | undefined): number {
  if (!status) return 502;
  if (status === 429) return 429;
  return 502;
}

type FunctionToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

function isFunctionToolCall(toolCall: unknown): toolCall is FunctionToolCall {
  if (!toolCall || typeof toolCall !== "object") {
    return false;
  }

  const value = toolCall as Record<string, unknown>;
  const fn = value.function;

  if (!fn || typeof fn !== "object") {
    return false;
  }

  const functionValue = fn as Record<string, unknown>;

  return (
    value.type === "function" &&
    typeof value.id === "string" &&
    typeof functionValue.name === "string" &&
    typeof functionValue.arguments === "string"
  );
}
