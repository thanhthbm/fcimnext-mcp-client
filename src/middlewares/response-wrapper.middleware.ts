import type { NextFunction, Request, Response } from "express";

type ResponseBody = unknown;

function isAlreadyWrapped(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }

  return "success" in body && "message" in body && "data" in body;
}

export function responseWrapperMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalJson = res.json.bind(res);

  res.json = function (body: ResponseBody) {
    if (isAlreadyWrapped(body)) {
      return originalJson(body);
    }

    const statusCode = res.statusCode;

    const isSuccess = statusCode >= 200 && statusCode < 300;

    if (!isSuccess) {
      return originalJson(body);
    }

    return originalJson({
      success: true,
      message: "OK",
      data: body ?? null,
      timestamp: new Date().toISOString(),
    });
  };

  next();
}
