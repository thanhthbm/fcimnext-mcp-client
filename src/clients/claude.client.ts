import Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk/core/error.js";
import type {
  ContentBlock,
  ContentBlockParam,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages/messages.js";

import { LlmError } from "../errors/llm-error.js";
import type {
  LlmChatInput,
  LlmChatOutput,
  LlmClient,
  LlmMessage,
} from "../types/llm.type.js";
import type { ToolCall, ToolDefinition } from "../types/tool.type.js";

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "missing-key",
});

export const claudeClient: LlmClient = {
  async chat(input: LlmChatInput): Promise<LlmChatOutput> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new LlmError({
        provider: "claude",
        message: "Missing ANTHROPIC_API_KEY",
        statusCode: 500,
      });
    }

    const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5";

    try {
      const response = await claude.messages.create({
        model,
        max_tokens: Number(process.env.CLAUDE_MAX_TOKENS || 4096),
        system: "You are a helpful assistant. Answer in Vietnamese.",
        messages: input.messages.map(toClaudeMessage),
        tools: input.tools?.map(toClaudeTool),
        tool_choice: input.tools?.length ? { type: "auto" } : undefined,
      });

      const text = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      const toolCalls = response.content
        .filter(isToolUseBlock)
        .map((block) => {
          return {
            id: block.id,
            name: block.name,
            arguments: toJsonObject(block.input),
          } satisfies ToolCall;
        });

      return {
        content: text || null,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        metadata: {
          provider: "claude",
          model,
          usage: response.usage,
          stopReason: response.stop_reason,
        },
      };
    } catch (error) {
      throw normalizeClaudeError(error);
    }
  },
};

function toClaudeMessage(message: LlmMessage): MessageParam {
  if (message.role === "system") {
    return {
      role: "user",
      content: message.content,
    };
  }

  if (message.role === "tool") {
    return {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: message.toolCallId,
          content: message.content,
        },
      ],
    };
  }

  if (message.role === "assistant") {
    return {
      role: "assistant",
      content: toClaudeAssistantContent(message),
    };
  }

  return {
    role: "user",
    content: message.content,
  };
}

function toClaudeAssistantContent(message: Extract<LlmMessage, { role: "assistant" }>) {
  const content: ContentBlockParam[] = [];

  if (message.content) {
    content.push({
      type: "text",
      text: message.content,
    });
  }

  for (const toolCall of message.toolCalls ?? []) {
    content.push({
      type: "tool_use",
      id: toolCall.id,
      name: toolCall.name,
      input: toolCall.arguments ?? {},
    });
  }

  return content.length ? content : "";
}

function toClaudeTool(tool: ToolDefinition): Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: toClaudeInputSchema(tool.inputSchema),
  };
}

function toClaudeInputSchema(schema: Record<string, unknown>) {
  return {
    ...schema,
    type: "object" as const,
  };
}

function toJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function normalizeClaudeError(error: unknown): LlmError {
  if (error instanceof APIError) {
    return new LlmError({
      provider: "claude",
      message: error.message || "Claude API error",
      statusCode: mapProviderStatusToHttpStatus(error.status),
      details: {
        status: error.status,
        type: error.type,
        requestId: error.requestID,
        error: error.error,
      },
    });
  }

  return new LlmError({
    provider: "claude",
    message: "Failed to call Claude API",
    statusCode: 502,
    details: error instanceof Error ? error.message : error,
  });
}

function mapProviderStatusToHttpStatus(status: number | undefined): number {
  if (!status) return 502;
  if (status === 429) return 429;
  return 502;
}

type ToolUseContentBlock = Extract<ContentBlock, { type: "tool_use" }>;

function isToolUseBlock(block: ContentBlock): block is ToolUseContentBlock {
  return block.type === "tool_use";
}
