import { z } from "zod";

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
});
