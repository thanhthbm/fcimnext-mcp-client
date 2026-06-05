import { OAuthTokenModel } from "../models/oauth-token.model.js";

export const oauthTokenRepository = {
  async findByUserAndSite(params: { frappeBaseUrl: string; userId: string }) {
    return OAuthTokenModel.findOne({
      frappeBaseUrl: params.frappeBaseUrl,
      userId: params.userId,
    });
  },

  async upsert(data: {
    frappeBaseUrl: string;
    userId: string;
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    tokenType?: string;
    scope?: string;
    expiresAt?: Date;
  }) {
    return OAuthTokenModel.findOneAndUpdate(
      {
        frappeBaseUrl: data.frappeBaseUrl,
        userId: data.userId,
      },
      {
        frappeBaseUrl: data.frappeBaseUrl,
        userId: data.userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        idToken: data.idToken,
        tokenType: data.tokenType ?? "Bearer",
        scope: data.scope,
        expiresAt: data.expiresAt,
      },
      {
        upsert: true,
        new: true,
      },
    );
  },
};
