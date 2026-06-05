import {mcpClient} from "../clients/mcp.client.js";
import type {ToolCall, ToolResult} from "../types/tool.type.js";

export const toolOrchestratorService = {
    async executeToolCall(toolCalls: ToolCall[]): Promise<ToolResult[]> {
        const result: ToolResult[] = [];

        for (const toolCall of toolCalls) {
            const toolResult = await mcpClient.callTool(toolCall);
            result.push(toolResult);
        }

        return result;
    }
}