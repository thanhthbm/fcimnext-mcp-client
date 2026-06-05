import mongoose from "mongoose";

import { MessageModel } from "../models/message.model.js";
import type { ChatMessageRole } from "../types/chat.type.js";

export const messageRepository = {
  async create(data: {
    conversationId: string;
    role: ChatMessageRole;
    content?: string;
    toolCallId?: string;
    toolName?: string;
    toolCalls?: unknown;
    metadata?: Record<string, unknown>;
  }) {
    return MessageModel.create({
      conversationId: new mongoose.Types.ObjectId(data.conversationId),
      role: data.role,
      content: data.content ?? "",
      toolCallId: data.toolCallId,
      toolName: data.toolName,
      toolCalls: data.toolCalls,
      metadata: data.metadata ?? {},
    });
  },

  async findRecentByConversationId(conversationId: string, limit = 20) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return [];
    }

    return MessageModel.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .then((messages) => messages.reverse());
  },

  async countByConversationId(conversationId: string) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return 0;
    }

    return MessageModel.countDocuments({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    });
  },

  async findByConversationId(conversationId: string) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return [];
    }

    return MessageModel.find({
      conversationId: new mongoose.Types.ObjectId(conversationId),
    })
      .sort({ createdAt: 1 })
      .lean();
  },
};
