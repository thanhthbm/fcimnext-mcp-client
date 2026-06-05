export type ChatMessageRole = "system" | "user" | "assistant" | "tool";

export type SendMessageInput = {
  message: string;
  conversationId?: string;
  userId?: string;
};

export type SendMessageOutput = {
  conversationId: string;
  answer: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: Date;
};

export type ConversationMessageItem = {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: unknown;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type GetConversationMessagesOutput = {
  conversationId: string;
  messages: ConversationMessageItem[];
};
