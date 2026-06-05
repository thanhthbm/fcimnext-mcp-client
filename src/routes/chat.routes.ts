import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { sendMessageSchema } from "../schema/chat.schema.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";

export const chatRouter = Router();

chatRouter.post(
  "/messages",
  validate({
    body: sendMessageSchema,
  }),
  asyncHandler(chatController.sendMessage),
);
