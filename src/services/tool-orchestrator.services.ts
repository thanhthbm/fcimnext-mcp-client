import {mcpClient} from "../clients/mcp.client.js";
import type {ToolCall, ToolResult} from "../types/tool.type.js";

export const toolOrchestratorService = {
    async executeToolCalls({toolCalls, userId}: { toolCalls: ToolCall[]; userId: string }): Promise<ToolResult[]> {
        const result: ToolResult[] = [];

        for (const toolCall of toolCalls) {
            const toolResult = await mcpClient.callTool({
                ...toolCall,
                userId,
            });
            result.push(toolResult);
        }

        return result;
    }
}