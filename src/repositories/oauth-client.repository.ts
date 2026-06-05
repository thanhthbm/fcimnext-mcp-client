import { OAuthClientModel } from "../models/oauth-client.model.js";

export const oauthClientRepository = {
  async findByFrappeBaseUrl(frappeBaseUrl: string) {
    return OAuthClientModel.findOne({
      frappeBaseUrl,
    });
  },

  async upsert(data: {
    frappeBaseUrl: string;
    clientId: string;
    clientSecret?: string;
    clientName?: string;
    redirectUris?: string[];
    tokenEndpointAuthMethod?: string;
  }) {
    return OAuthClientModel.findOneAndUpdate(
      {
        frappeBaseUrl: data.frappeBaseUrl,
      },
      {
        frappeBaseUrl: data.frappeBaseUrl,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        clientName: data.clientName,
        redirectUris: data.redirectUris ?? [],
        tokenEndpointAuthMethod: data.tokenEndpointAuthMethod ?? "none",
      },
      {
        upsert: true,
        new: true,
      },
    );
  },
};
