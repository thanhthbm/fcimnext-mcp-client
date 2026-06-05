export type OAuthDiscovery = {
  issuer?: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  mcp_endpoint?: string;
  code_challenge_methods_supported?: string[];
  grant_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
};

export type OAuthRegisteredClient = {
  client_id: string;
  client_secret?: string;
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
};

export type OAuthTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
};

export type OAuthTokenExchangeResult = OAuthTokenResponse & {
  userId?: string;
};

export type OAuthToken = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt?: number;
};
