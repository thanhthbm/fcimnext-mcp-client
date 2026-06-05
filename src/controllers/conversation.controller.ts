import type { Request, Response } from "express";

import { conversationService } from "../services/conversation.services.js";

export const conversationController = {
  async getMessages(req: Request, res: Response) {
    const { conversationId } = req.params;

    const result = await conversationService.getMessages(
      conversationId as string,
    );

    return res.json(result);
  },
};
