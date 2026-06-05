import mongoose, { Schema, type InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
  {
    userId: {
      type: String,
      required: false,
      index: true,
    },

    title: {
      type: String,
      required: false,
      trim: true,
    },

    summary: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

export type ConversationDocument = InferSchemaType<
  typeof conversationSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
