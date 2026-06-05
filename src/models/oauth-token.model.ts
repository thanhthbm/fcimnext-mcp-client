import mongoose, { Schema, type InferSchemaType } from "mongoose";

const oauthTokenSchema = new Schema(
  {
    frappeBaseUrl: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    accessToken: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
      required: false,
    },

    idToken: {
      type: String,
      required: false,
    },

    tokenType: {
      type: String,
      default: "Bearer",
    },

    scope: {
      type: String,
      required: false,
    },

    expiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

oauthTokenSchema.index(
  {
    frappeBaseUrl: 1,
    userId: 1,
  },
  {
    unique: true,
  },
);

export type OAuthTokenDocument = InferSchemaType<typeof oauthTokenSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OAuthTokenModel =
  mongoose.models.OAuthToken || mongoose.model("OAuthToken", oauthTokenSchema);
