type OAuthState = {
  codeVerifier: string;
  createdAt: number;
};

const states = new Map<string, OAuthState>();

const STATE_TTL_MS = 10 * 60 * 1000;

export const oauthStateStore = {
  save(state: string, data: OAuthState) {
    states.set(state, data);
  },

  consume(state: string): OAuthState | null {
    const data = states.get(state);

    if (!data) {
      return null;
    }

    states.delete(state);

    const isExpired = Date.now() - data.createdAt > STATE_TTL_MS;

    if (isExpired) {
      return null;
    }

    return data;
  },
};
