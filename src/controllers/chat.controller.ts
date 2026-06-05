import type { Request, Response } from "express";

import { chatService } from "../services/chat.services.js";
import type { SendMessageInput } from "../types/chat.type.js";

export const chatController = {
  async sendMessage(req: Request, res: Response) {
    const { message, conversationId } = req.body;

    const input: SendMessageInput = {
      message,
      conversationId,
      userId: req.user?.id ?? "dev-user",
    };

    const result = await chatService.sendMessage(input);

    return res.json(result);
  },
};
