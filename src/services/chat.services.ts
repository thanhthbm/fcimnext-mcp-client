import { llmClient } from "../clients/llm.client.js";
import { AppError } from "../errors/app-error.js";
import { toLlmMessages } from "../mappers/message.mapper.js";
import { conversationRepository } from "../repositories/conversation.repository.js";
import { messageRepository } from "../repositories/message.repository.js";
import { toolOrchestratorService } from "./tool-orchestrator.services.js";
import { getToolDefinitions } from "../tools/tool-registry.js";
import { skillContextService } from "./skill-context.services.js";
import type {
  SendMessageInput,
  SendMessageOutput,
} from "../types/chat.type.js";
import type { LlmMessage } from "../types/llm.type.js";

const MAX_TOOL_ROUNDS = 5;
const RECENT_MESSAGE_LIMIT = 20;
const DEFAULT_USER_ID = "dev-user";

export const chatService = {
  async sendMessage(input: SendMessageInput): Promise<SendMessageOutput> {
    const userId = input.userId ?? DEFAULT_USER_ID;
    const conversationId = await getOrCreateConversationId({
      ...input,
      userId,
    });

    await messageRepository.create({
      conversationId,
      role: "user",
      content: input.message,
    });

    const recentMessages = await messageRepository.findRecentByConversationId(
      conversationId,
      RECENT_MESSAGE_LIMIT,
    );

    const skillContext = await skillContextService.getSkillContextForMessage({
      userMessage: input.message,
      userId,
    });

    const messages: LlmMessage[] = [
      ...(skillContext
        ? [
            {
              role: "system" as const,
              content: `Relevant Frappe Assistant Core skills:\n\n${skillContext}`,
            },
          ]
        : []),
      ...toLlmMessages(recentMessages),
    ];

    const finalAnswer = await runLlmToolLoop({
      conversationId,
      userId,
      messages,
    });

    return {
      conversationId,
      answer: finalAnswer,
    };
  },
};

async function runLlmToolLoop(params: {
  conversationId: string;
  userId: string;
  messages: LlmMessage[];
}): Promise<string> {
  const { conversationId, userId, messages } = params;

  const toolDefinitions = await getToolDefinitions(userId);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const llmResponse = await llmClient.chat({
      messages,
      tools: toolDefinitions,
    });

    const toolCalls = llmResponse.toolCalls ?? [];

    if (toolCalls.length === 0) {
      const finalAnswer = llmResponse.content ?? "";

      await messageRepository.create({
        conversationId,
        role: "assistant",
        content: finalAnswer,
        metadata: llmResponse.metadata,
      });

      return finalAnswer;
    }

    await messageRepository.create({
      conversationId,
      role: "assistant",
      content: llmResponse.content ?? "",
      toolCalls,
      metadata: llmResponse.metadata,
    });

    messages.push({
      role: "assistant",
      content: llmResponse.content,
      toolCalls,
    });

    const toolResults = await toolOrchestratorService.executeToolCalls({
      toolCalls,
      userId,
    });

    for (const toolResult of toolResults) {
      const toolContent = JSON.stringify(toolResult.content);

      await messageRepository.create({
        conversationId,
        role: "tool",
        content: toolContent,
        toolCallId: toolResult.toolCallId,
        toolName: toolResult.toolName,
        metadata: {
          isError: toolResult.isError ?? false,
        },
      });

      messages.push({
        role: "tool",
        content: toolContent,
        toolCallId: toolResult.toolCallId,
        toolName: toolResult.toolName,
      });
    }
  }

  throw new AppError("Too many tool call rounds", 500);
}

async function getOrCreateConversationId(
  input: SendMessageInput,
): Promise<string> {
  if (input.conversationId) {
    const conversation = await conversationRepository.findById(
      input.conversationId,
    );

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    return input.conversationId;
  }

  const conversation = await conversationRepository.create({
    userId: input.userId,
    title: input.message.slice(0, 80),
  });

  return conversation._id.toString();
}
