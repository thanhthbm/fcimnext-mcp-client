import type { Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { oauthService } from "../services/oauth.services.js";
import { oauthTokenStore } from "../oauth/oauth-token.store.js";

export const oauthController = {
  async discovery(_req: Request, res: Response) {
    const discovery = await oauthService.discover();

    return res.json(discovery);
  },

  async registerClient(_req: Request, res: Response) {
    const client = await oauthService.registerClient();

    return res.json({
      client,
      note: "Save client_id to .env or database. Do not register a new client on every request in production.",
    });
  },

  async connect(_req: Request, res: Response) {
    const authorizationUrl = await oauthService.buildAuthorizationUrl();

    return res.redirect(authorizationUrl);
  },

  async callback(req: Request, res: Response) {
    const { code, state, error, error_description } = req.query;

    if (error) {
      throw new AppError(String(error), 400, {
        error_description,
      });
    }

    if (typeof code !== "string") {
      throw new AppError("Missing OAuth code", 400);
    }

    if (typeof state !== "string") {
      throw new AppError("Missing OAuth state", 400);
    }

    const token = await oauthService.exchangeCodeForToken({
      code,
      state,
    });

    oauthTokenStore.save({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      idToken: token.id_token,
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt: token.expires_in
        ? Date.now() + token.expires_in * 1000
        : undefined,
    });

    return res.json({
      message: "OAuth connected",
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
    });
  },
};
