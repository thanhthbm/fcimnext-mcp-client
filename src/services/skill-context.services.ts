import { mcpClient } from "../clients/mcp.client.js";

export const skillContextService = {
  async getSkillContextForMessage(params: {
    userMessage: string;
    userId: string;
  }): Promise<string> {
    if (!mcpClient.listResources || !mcpClient.readResource) {
      return "";
    }

    const { userMessage, userId } = params;

    const resources = await mcpClient.listResources({ userId });

    const skillResources = resources
      .filter((resource) => resource.uri.startsWith("fac://skills/"))
      .filter((resource) => isRelevantSkill(resource, userMessage))
      .slice(0, 5);

    const contents = await Promise.all(
      skillResources.map((resource) =>
        mcpClient.readResource!(resource.uri, { userId }),
      ),
    );

    return contents
      .flat()
      .map((content) => {
        return `# Skill: ${content.uri}\n\n${content.text}`;
      })
      .join("\n\n---\n\n");
  },
};

function isRelevantSkill(
  resource: { name: string; description?: string; uri: string },
  userMessage: string,
): boolean {
  const haystack = [resource.uri, resource.name, resource.description ?? ""]
    .join(" ")
    .toLowerCase();

  const query = userMessage.toLowerCase();

  return query
    .split(/\s+/)
    .some((word) => word.length >= 4 && haystack.includes(word));
}
