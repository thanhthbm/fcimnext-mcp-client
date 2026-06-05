import type { McpClient } from "../types/mcp.type.js";
import { facMcpClient } from "./fac-mcp.client.js";
import { mockMcpClient } from "./mock-mcp.client.js";

function createMcpClient(): McpClient {
  const provider = (process.env.MCP_PROVIDER || "mock").trim().toLowerCase();

  console.log("Using MCP provider:", provider);

  if (provider === "fac") {
    return facMcpClient;
  }

  return mockMcpClient;
}

export const mcpClient = createMcpClient();
