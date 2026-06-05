import { OAuthToken } from "../types/oauth.type.js";

let currentToken: OAuthToken | null = null;

export const oauthTokenStore = {
  save(token: OAuthToken) {
    currentToken = token;
  },

  get(): OAuthToken | null {
    return currentToken;
  },

  clear() {
    currentToken = null;
  },
};
