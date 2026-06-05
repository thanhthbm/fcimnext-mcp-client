import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app-error.js";
import { LlmError } from "../errors/llm-error.js";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: null,
      errors: formatErrorDetails(error.details),
      timestamp: new Date().toISOString(),
    });
  }

  if (error instanceof LlmError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: null,
      errors: {
        provider: error.provider,
        details: formatErrorDetails(error.details),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    data: null,
    errors: null,
    timestamp: new Date().toISOString(),
  });
};

function formatErrorDetails(details: unknown) {
  if (details instanceof ZodError) {
    return details.flatten();
  }

  return details ?? null;
}
