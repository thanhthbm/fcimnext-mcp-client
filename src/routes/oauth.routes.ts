import { Router } from "express";

import { oauthController } from "../controllers/oauth.controller.js";
import { asyncHandler } from "../middlewares/async-handler.middleware.js";

export const oauthRouter = Router();

oauthRouter.get("/discovery", asyncHandler(oauthController.discovery));

oauthRouter.post(
  "/register-client",
  asyncHandler(oauthController.registerClient),
);

oauthRouter.get(
  "/connect",
  asyncHandler(oauthController.connect),
);

oauthRouter.get(
  "/callback",
  asyncHandler(oauthController.callback),
);