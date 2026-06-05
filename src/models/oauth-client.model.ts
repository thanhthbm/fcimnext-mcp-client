import mongoose, { Schema, type InferSchemaType } from "mongoose";

const oauthClientSchema = new Schema(
  {
    frappeBaseUrl: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    clientId: {
      type: String,
      required: true,
    },

    clientSecret: {
      type: String,
      required: false,
    },

    clientName: {
      type: String,
      required: false,
    },

    redirectUris: {
      type: [String],
      default: [],
    },

    tokenEndpointAuthMethod: {
      type: String,
      default: "none",
    },
  },
  {
    timestamps: true,
  },
);

export type OAuthClientDocument = InferSchemaType<typeof oauthClientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OAuthClientModel =
  mongoose.models.OAuthClient ||
  mongoose.model("OAuthClient", oauthClientSchema);
