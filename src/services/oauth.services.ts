import {
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";

import { AppError } from "../errors/app-error.js";
import { oauthStateStore } from "../oauth/oauth-state.store.js";
import { oauthClientRepository } from "../repositories/oauth-client.repository.js";
import type {
  OAuthDiscovery,
  OAuthRegisteredClient,
  OAuthTokenExchangeResult,
  OAuthTokenResponse,
} from "../types/oauth.type.js";

function getFrappeBaseUrl(): string {
  const baseUrl = process.env.FRAPPE_BASE_URL;

  if (!baseUrl) {
    throw new AppError("Missing FRAPPE_BASE_URL", 500);
  }

  return baseUrl.replace(/\/$/, "");
}

function getOAuthRedirectUri(): string {
  const redirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!redirectUri) {
    throw new AppError("Missing OAUTH_REDIRECT_URI", 500);
  }

  return redirectUri;
}

async function getOrRegisterOAuthClient() {
  const frappeBaseUrl = getFrappeBaseUrl();

  const existingClient =
    await oauthClientRepository.findByFrappeBaseUrl(frappeBaseUrl);

  if (existingClient) {
    return existingClient;
  }

  const client = await oauthService.registerClient();

  const savedClient =
    await oauthClientRepository.findByFrappeBaseUrl(frappeBaseUrl);

  if (!savedClient) {
    throw new AppError("OAuth client registration was not persisted", 500);
  }

  return savedClient;
}

export const oauthService = {
  async discover(): Promise<OAuthDiscovery> {
    const baseUrl = getFrappeBaseUrl();
    const discoveryUrl = `${baseUrl}/.well-known/openid-configuration`;

    const response = await fetch(discoveryUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new AppError("OAuth discovery failed", 502, {
        status: response.status,
        body: await response.text(),
      });
    }

    return response.json() as Promise<OAuthDiscovery>;
  },

  async registerClient(): Promise<OAuthRegisteredClient> {
    const discovery = await this.discover();

    if (!discovery.registration_endpoint) {
      throw new AppError(
        "OAuth discovery response does not include registration_endpoint",
        502,
        discovery,
      );
    }

    const frappeBaseUrl = getFrappeBaseUrl();

    const response = await fetch(discovery.registration_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_name: process.env.OAUTH_CLIENT_NAME || "Node MCP Chatbot",
        redirect_uris: [getOAuthRedirectUri()],
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        scope: "all openid",
      }),
    });

    if (!response.ok) {
      throw new AppError("Dynamic client registration failed", 502, {
        status: response.status,
        body: await response.text(),
      });
    }

    const client = (await response.json()) as OAuthRegisteredClient;

    await oauthClientRepository.upsert({
      frappeBaseUrl,
      clientId: client.client_id,
      clientSecret: client.client_secret,
      clientName: client.client_name,
      redirectUris: client.redirect_uris,
      tokenEndpointAuthMethod: client.token_endpoint_auth_method,
    });

    return client;
  },

  async buildAuthorizationUrl(params?: { userId?: string }): Promise<string> {
    const discovery = await this.discover();
    const client = await getOrRegisterOAuthClient();

    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = randomState();

    oauthStateStore.save(state, {
      codeVerifier,
      createdAt: Date.now(),
      userId: params?.userId,
    });

    const url = new URL(discovery.authorization_endpoint);

    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", client.clientId);
    url.searchParams.set("redirect_uri", getOAuthRedirectUri());
    url.searchParams.set("scope", "all openid");
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", state);

    return url.toString();
  },

  async exchangeCodeForToken(params: {
    code: string;
    state: string;
  }): Promise<OAuthTokenExchangeResult> {
    const savedState = oauthStateStore.consume(params.state);

    if (!savedState) {
      throw new AppError("Invalid or expired OAuth state", 400);
    }

    const discovery = await this.discover();
    const client = await getOrRegisterOAuthClient();

    const body = new URLSearchParams();

    body.set("grant_type", "authorization_code");
    body.set("code", params.code);
    body.set("redirect_uri", getOAuthRedirectUri());
    body.set("client_id", client.clientId);
    body.set("code_verifier", savedState.codeVerifier);

    // Với token_endpoint_auth_method = none thì không cần client_secret.
    // Nếu sau này đổi sang client_secret_post, mở đoạn này:
    if (
      client.tokenEndpointAuthMethod &&
      client.tokenEndpointAuthMethod !== "none" &&
      client.clientSecret
    ) {
      body.set("client_secret", client.clientSecret);
    }

    const response = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    if (!response.ok) {
      throw new AppError("OAuth token exchange failed", 502, {
        status: response.status,
        body: await response.text(),
      });
    }

    const token = (await response.json()) as OAuthTokenResponse;

    return {
      ...token,
      userId: savedState.userId,
    };
  },

  async refreshAccessToken(params: {
    refreshToken: string;
  }): Promise<OAuthTokenResponse> {
    const discovery = await this.discover();
    const client = await getOrRegisterOAuthClient();

    const body = new URLSearchParams();

    body.set("grant_type", "refresh_token");
    body.set("refresh_token", params.refreshToken);
    body.set("client_id", client.clientId);

    if (
      client.tokenEndpointAuthMethod &&
      client.tokenEndpointAuthMethod !== "none" &&
      client.clientSecret
    ) {
      body.set("client_secret", client.clientSecret);
    }

    const response = await fetch(discovery.token_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    if (!response.ok) {
      throw new AppError("OAuth token refresh failed", 502, {
        status: response.status,
        body: await response.text(),
      });
    }

    return response.json() as Promise<OAuthTokenResponse>;
  },
};
