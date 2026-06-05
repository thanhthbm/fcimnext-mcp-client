import mongoose from "mongoose";

import { ConversationModel } from "../models/conversation.model.js";

export const conversationRepository = {
  async create(data?: { userId?: string; title?: string; summary?: string }) {
    return ConversationModel.create({
      userId: data?.userId,
      title: data?.title,
      summary: data?.summary ?? "",
    });
  },

  async findById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return ConversationModel.findById(id);
  },

  async updateSummary(id: string, summary: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return ConversationModel.findByIdAndUpdate(id, { summary }, { new: true });
  },
};
