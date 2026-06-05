import { Router } from "express";

import { conversationController } from "../controllers/conversation.controller.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { conversationIdParamsSchema } from "../schema/conversation.schema.js";

export const conversationRouter = Router();

conversationRouter.get(
  "/:conversationId/messages",
  validate({
    params: conversationIdParamsSchema,
  }),
  asyncHandler(conversationController.getMessages),
);
