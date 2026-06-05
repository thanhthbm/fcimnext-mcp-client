import { AppError } from "../errors/app-error.js";
import { oauthTokenRepository } from "../repositories/oauth-token.repository.js";
import { oauthService } from "../services/oauth.services.js";
import { McpResource, McpResourceContent } from "../types/mcp-resource.type.js";
import type { McpClient } from "../types/mcp.type.js";
import type {
  ToolCall,
  ToolDefinition,
  ToolResult,
} from "../types/tool.type.js";

const DEV_USER_ID = "dev-user";
const TOKEN_REFRESH_SKEW_MS = 60 * 1000;

export const facMcpClient: McpClient = {
  async listTools(context): Promise<ToolDefinition[]> {
    const token = await getValidAccessToken(context?.userId);
    const discovery = await oauthService.discover();
    const mcpEndpoint = getMcpEndpoint(discovery);

    const body = await callMcpEndpoint({
      mcpEndpoint,
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      method: "tools/list",
      params: {},
    });

    return mapMcpTools(body.result?.tools ?? []);
  },

  async callTool(toolCall: ToolCall): Promise<ToolResult> {
    const token = await getValidAccessToken(toolCall.userId);
    const discovery = await oauthService.discover();
    const mcpEndpoint = getMcpEndpoint(discovery);

    const body = await callMcpEndpoint({
      mcpEndpoint,
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      method: "tools/call",
      params: {
        name: toolCall.name,
        arguments: toolCall.arguments ?? {},
      },
    });

    const result = body.result ?? body;
    const normalizedResult = normalizeMcpResult(result);

    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      content: normalizedResult,
      isError: hasMcpError(body, result),
    };
  },

  async listResources(context): Promise<McpResource[]> {
    const token = await getValidAccessToken(context?.userId);
    const discovery = await oauthService.discover();
    const mcpEndpoint = getMcpEndpoint(discovery);

    const body = await callMcpEndpoint({
      mcpEndpoint,
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      method: "resources/list",
      params: {},
    });
    return mapMcpResources(body.result?.resources ?? []);
  },

  async readResource(
    uri: string,
    context,
  ): Promise<McpResourceContent[]> {
    const token = await getValidAccessToken(context?.userId);
    const discovery = await oauthService.discover();
    const mcpEndpoint = getMcpEndpoint(discovery);

    const body = await callMcpEndpoint({
      mcpEndpoint,
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      method: "resources/read",
      params: {
        uri,
      },
    });

    return mapMcpResourceContents(body.result?.contents ?? []);
  },
};

async function getValidAccessToken(userId = DEV_USER_ID) {
  const frappeBaseUrl = getFrappeBaseUrl();

  const token = await oauthTokenRepository.findByUserAndSite({
    frappeBaseUrl,
    userId,
  });

  if (!token) {
    throw new AppError("FAC OAuth token is missing. Connect OAuth first.", 401);
  }

  const expiresAtMs = token.expiresAt?.getTime();

  const shouldRefresh =
    expiresAtMs && Date.now() > expiresAtMs - TOKEN_REFRESH_SKEW_MS;

  if (!shouldRefresh) {
    return {
      accessToken: token.accessToken,
      tokenType: token.tokenType || "Bearer",
    };
  }

  if (!token.refreshToken) {
    throw new AppError(
      "FAC refresh token is missing. Connect OAuth again.",
      401,
    );
  }

  const refreshed = await oauthService.refreshAccessToken({
    refreshToken: token.refreshToken,
  });

  const refreshedExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000)
    : undefined;

  const updatedToken = await oauthTokenRepository.upsert({
    frappeBaseUrl,
    userId,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? token.refreshToken,
    idToken: refreshed.id_token ?? token.idToken,
    tokenType: refreshed.token_type,
    scope: refreshed.scope,
    expiresAt: refreshedExpiresAt,
  });

  return {
    accessToken: updatedToken.accessToken,
    tokenType: updatedToken.tokenType || "Bearer",
  };
}

function getFrappeBaseUrl(): string {
  const baseUrl = process.env.FRAPPE_BASE_URL;

  if (!baseUrl) {
    throw new AppError("Missing FRAPPE_BASE_URL", 500);
  }

  return baseUrl.replace(/\/$/, "");
}

function getMcpEndpoint(discovery: { mcp_endpoint?: string }): string {
  if (!discovery.mcp_endpoint) {
    throw new AppError(
      "OAuth discovery response does not include mcp_endpoint",
      502,
    );
  }

  return discovery.mcp_endpoint;
}

async function callMcpEndpoint(params: {
  mcpEndpoint: string;
  accessToken: string;
  tokenType: string;
  method: string;
  params: Record<string, unknown>;
}) {
  const response = await fetch(params.mcpEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `${params.tokenType} ${params.accessToken}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: params.method,
      params: params.params,
    }),
  });

  const body = await response.json();

  if (!response.ok || body.error) {
    throw new AppError(`FAC MCP ${params.method} failed`, 502, {
      status: response.status,
      body,
    });
  }

  return body;
}

function mapMcpTools(tools: unknown[]): ToolDefinition[] {
  return tools
    .map((tool) => {
      const value = tool as {
        name?: string;
        description?: string;
        inputSchema?: Record<string, unknown>;
        input_schema?: Record<string, unknown>;
      };

      return {
        name: value.name ?? "",
        description: value.description ?? "",
        inputSchema: value.inputSchema ??
          value.input_schema ?? {
            type: "object",
            properties: {},
          },
      };
    })
    .filter((tool) => tool.name);
}

function normalizeMcpResult(result: unknown): unknown {
  const value = result as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    isError?: boolean;
  };

  if (!Array.isArray(value.content)) {
    return result;
  }

  const textParts = value.content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string);

  if (textParts.length === 0) {
    return result;
  }

  const text = textParts.join("\n");
  const parsed = tryParseJson(text);

  return parsed ?? text;
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function hasMcpError(body: unknown, result: unknown): boolean {
  const bodyValue = body as { error?: unknown };
  const resultValue = result as { isError?: boolean };

  return Boolean(bodyValue.error || resultValue.isError);
}

function mapMcpResourceContents(contents: unknown[]): McpResourceContent[] {
  return contents
    .map((content) => {
      const value = content as {
        uri?: string;
        mimeType?: string;
        mime_type?: string;
        text?: string;
      };

      return {
        uri: value.uri ?? "",
        mimeType: value.mimeType ?? value.mime_type,
        text: value.text ?? "",
      };
    })
    .filter((content) => content.uri && content.text);
}

function mapMcpResources(resources: unknown[]): McpResource[] {
  return resources
    .map((resource) => {
      const value = resource as {
        uri?: string;
        name?: string;
        description?: string;
        mimeType?: string;
        mime_type?: string;
      };

      return {
        uri: value.uri ?? "",
        name: value.name ?? "",
        description: value.description,
        mimeType: value.mimeType ?? value.mime_type,
      };
    })
    .filter((resource) => resource.uri);
}
