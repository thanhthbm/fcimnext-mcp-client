import {healthRouter} from "./health.routes.js";
import {chatRouter} from "./chat.routes.js";
import { Router } from "express";
import { conversationRouter } from "./conversation.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/conversations", conversationRouter);