import { mcpClient } from "../clients/mcp.client.js";

export const skillContextService = {
  async getSkillContextForMessage(userMessage: string): Promise<string> {
    if (!mcpClient.listResources || !mcpClient.readResource) {
      return "";
    }

    const resources = await mcpClient.listResources();

    const skillResources = resources
      .filter((resource) => resource.uri.startsWith("fac://skills/"))
      .filter((resource) => isRelevantSkill(resource, userMessage))
      .slice(0, 5);

    const contents = await Promise.all(
      skillResources.map((resource) => mcpClient.readResource!(resource.uri)),
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

  // bản đơn giản trước
  return query
    .split(/\s+/)
    .some((word) => word.length >= 4 && haystack.includes(word));
}
