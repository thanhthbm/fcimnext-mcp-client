import type { Request, Response } from "express";

import { mcpClient } from "../clients/mcp.client.js";

export const mcpController = {
  async listTools(req: Request, res: Response) {
    const tools = await mcpClient.listTools({
      userId: req.user?.id,
    });

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
      userId: req.user?.id,
    });

    return res.json(result);
  },

  async listResources(req: Request, res: Response) {
    if (!mcpClient.listResources) {
      return res.json({
        resources: [],
      });
    }

    const resources = await mcpClient.listResources({
      userId: req.user?.id,
    });

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

    const contents = await mcpClient.readResource(uri, {
      userId: req.user?.id,
    });

    return res.json({
      contents,
    });
  },
};
