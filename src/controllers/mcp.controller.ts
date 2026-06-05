import type { Request, Response } from "express";

import { mcpClient } from "../clients/mcp.client.js";

export const mcpController = {
  async listTools(_req: Request, res: Response) {
    const tools = await mcpClient.listTools();

    return res.json({
      tools,
    });
  },
  async callTool(req: Request, res: Response) {
    const { name, arguments: args } = req.body;

    const result = await mcpClient.callTool({
      id: crypto.randomUUID(),
      name,
      arguments: args ?? {},
    });

    return res.json(result);
  },

  async listResources(_req: Request, res: Response) {
    if (!mcpClient.listResources) {
      return res.json({
        resources: [],
      });
    }

    const resources = await mcpClient.listResources();

    return res.json({
      resources,
    });
  },

  async readResource(req: Request, res: Response) {
    const { uri } = req.body;

    if (!mcpClient.readResource) {
      return res.json({
        contents: [],
      });
    }

    const contents = await mcpClient.readResource(uri);

    return res.json({
      contents,
    });
  },
};
