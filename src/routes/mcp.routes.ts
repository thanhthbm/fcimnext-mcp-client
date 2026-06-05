import { Router } from "express";

import { mcpController } from "../controllers/mcp.controller.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";

export const mcpRouter = Router();

mcpRouter.get("/tools", asyncHandler(mcpController.listTools));
mcpRouter.post("/tools/call", asyncHandler(mcpController.callTool));
mcpRouter.get("/resources", asyncHandler(mcpController.listResources));
mcpRouter.post("/resources/read", asyncHandler(mcpController.readResource));
