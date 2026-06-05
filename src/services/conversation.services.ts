import { AppError } from "../errors/app-error.js";
import { conversationRepository } from "../repositories/conversation.repository.js";
import { messageRepository } from "../repositories/message.repository.js";
import type {
  ConversationMessageItem,
  GetConversationMessagesOutput,
} from "../types/chat.type.js";

export const conversationService = {
  async getMessages(
    conversationId: string,
  ): Promise<GetConversationMessagesOutput> {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const messages =
      await messageRepository.findByConversationId(conversationId);

    return {
      conversationId,
      messages: messages.map((message) => {
        return {
          id: message._id.toString(),
          conversationId: message.conversationId.toString(),
          role: message.role,
          content: message.content ?? "",
          toolCallId: message.toolCallId,
          toolName: message.toolName,
          toolCalls: message.toolCalls,
          metadata: message.metadata,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        } satisfies ConversationMessageItem;
      }),
    };
  },
};
