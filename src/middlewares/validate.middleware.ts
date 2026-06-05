import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../errors/app-error.js";

type ValidateSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }

      return next();
    } catch (error) {
      return next(new AppError("Validation failed", 400, error));
    }
  };
}
