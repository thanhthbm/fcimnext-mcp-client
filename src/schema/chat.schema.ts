import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, "message is required"),
  conversationId: z.string().optional(),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
