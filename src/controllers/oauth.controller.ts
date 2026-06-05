import type { Request, Response } from "express";

import { AppError } from "../errors/app-error.js";
import { oauthTokenRepository } from "../repositories/oauth-token.repository.js";
import { oauthService } from "../services/oauth.services.js";

function getRequestUserId(req: Request): string {
  if (typeof req.query.userId === "string" && req.query.userId.trim()) {
    return req.query.userId.trim();
  }

  return req.user?.id ?? "dev-user";
}

function getFrappeBaseUrl(): string {
  const baseUrl = process.env.FRAPPE_BASE_URL;

  if (!baseUrl) {
    throw new AppError("Missing FRAPPE_BASE_URL", 500);
  }

  return baseUrl.replace(/\/$/, "");
}

export const oauthController = {
  async discovery(_req: Request, res: Response) {
    const discovery = await oauthService.discover();

    return res.json(discovery);
  },

  async registerClient(_req: Request, res: Response) {
    const client = await oauthService.registerClient();

    return res.json({
      client,
      note: "OAuth client saved to database. Do not register a new client on every request in production.",
    });
  },

  async connect(req: Request, res: Response) {
    const authorizationUrl = await oauthService.buildAuthorizationUrl({
      userId: getRequestUserId(req),
    });

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

    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : undefined;

    const userId = token.userId ?? getRequestUserId(req);

    await oauthTokenRepository.upsert({
      frappeBaseUrl: getFrappeBaseUrl(),
      userId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      idToken: token.id_token,
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt,
    });

    return res.json({
      message: "OAuth connected",
      userId,
      tokenType: token.token_type,
      scope: token.scope,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
  },
};
