import type { RequestHandler } from "express";

export const userContextMiddleware: RequestHandler = (req, _res, next) => {
  const frappeUser = req.header("x-frappe-user");
  const frappeUserEmail = req.header("x-frappe-user-email");
  const frappeUserFullName = req.header("x-frappe-user-full-name");

  const userId = frappeUser || frappeUserEmail || "dev-user";

  req.user = {
    id: userId,
    email: frappeUserEmail || frappeUser || undefined,
    fullName: frappeUserFullName || undefined,
  };

  return next();
};
