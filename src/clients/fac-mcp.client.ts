import { AppError } from "../errors/app-error.js";
import { oauthService } from "../services/oauth.services.js";
import { oauthTokenStore } from "../oauth/oauth-token.store.js";
import type { McpClient } from "../types/mcp.type.js";
import type {
  ToolCall,
  ToolDefinition,
  ToolResult,
} from "../types/tool.type.js";

export const facMcpClient: McpClient = {
  async listTools(): Promise<ToolDefinition[]> {
    const token = oauthTokenStore.get();

    if (!token?.accessToken) {
      throw new AppError(
        "FAC OAuth token is missing. Connect OAuth first.",
        401,
      );
    }

    const discovery = await oauthService.discover();

    if (!discovery.mcp_endpoint) {
      throw new AppError(
        "OAuth discovery response does not include mcp_endpoint",
        502,
      );
    }

    const response = await fetch(discovery.mcp_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `${token.tokenType} ${token.accessToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/list",
        params: {},
      }),
    });

    const body = await response.json();

    if (!response.ok || body.error) {
      throw new AppError("FAC MCP tools/list failed", 502, {
        status: response.status,
        body,
      });
    }

    return mapMcpTools(body.result?.tools ?? []);
  },

  async callTool(toolCall: ToolCall): Promise<ToolResult> {
    const token = getAccessToken();
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

    return {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      content: normalizeMcpResult(result),
      isError: Boolean(body.error || result?.isError),
    };
  },
  async listResources() {
    const token = getAccessToken();
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

  async readResource(uri: string) {
    const token = getAccessToken();
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

function getAccessToken() {
  const token = oauthTokenStore.get();

  if (!token?.accessToken) {
    throw new AppError("FAC OAuth token is missing. Connect OAuth first.", 401);
  }

  return token;
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

  if (parsed !== null) {
    return parsed;
  }

  return text;
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function mapMcpResources(resources: unknown[]) {
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

function mapMcpResourceContents(contents: unknown[]) {
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
