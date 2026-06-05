import cors from "cors";
import express from "express";

import { apiRouter } from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { responseWrapperMiddleware } from "./middlewares/response-wrapper.middleware.js";
import { userContextMiddleware } from "./middlewares/user-context.middleware.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use(userContextMiddleware);
app.use(responseWrapperMiddleware);
app.use("/api/v1", apiRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
