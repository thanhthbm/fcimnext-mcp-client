import OpenAI from "openai";

import { LlmError } from "../errors/llm-error.js";
import type {
  LlmChatInput,
  LlmChatOutput,
  LlmClient,
  LlmMessage,
} from "../types/llm.type.js";
import type { ToolCall, ToolDefinition } from "../types/tool.type.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
});

export const openaiClient: LlmClient = {
  async chat(input: LlmChatInput): Promise<LlmChatOutput> {
    if (!process.env.OPENAI_API_KEY) {
      throw new LlmError({
        provider: "openai",
        message: "Missing OPENAI_API_KEY",
        statusCode: 500,
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    try {
      const response = await openai.chat.completions.create({
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
          const args = safeParseJsonObject(toolCall.function.arguments || "{}");

          return {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: args,
          } satisfies ToolCall;
        });

      return {
        content: responseMessage?.content ?? null,
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        metadata: {
          provider: "openai",
          model,
          usage: response.usage,
          finishReason: response.choices[0]?.finish_reason,
        },
      };
    } catch (error) {
      throw normalizeOpenAiError(error);
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
            arguments: JSON.stringify(toolCall.arguments ?? {}),
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

function normalizeOpenAiError(error: unknown): LlmError {
  if (error instanceof OpenAI.APIError) {
    return new LlmError({
      provider: "openai",
      message: error.message || "OpenAI API error",
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
    provider: "openai",
    message: "Failed to call OpenAI API",
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
