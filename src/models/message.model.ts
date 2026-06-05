import mongoose, { Schema, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["system", "user", "assistant", "tool"],
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: false,
      default: "",
    },

    toolCallId: {
      type: String,
      required: false,
    },

    toolName: {
      type: String,
      required: false,
    },

    toolCalls: {
      type: Schema.Types.Mixed,
      required: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
      required: false,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

export type MessageDocument = InferSchemaType<typeof messageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
