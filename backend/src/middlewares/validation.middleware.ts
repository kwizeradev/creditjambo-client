import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export function validate(schema: ZodType, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);

      req[source] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors,
        });
        return;
      }

      res.status(500).json({
        status: 'error',
        message: 'Validation error',
      });
    }
  };
}

export function validateBody(schema: ZodType) {
  return validate(schema, 'body');
}

export function validateQuery(schema: ZodType) {
  return validate(schema, 'query');
}

export function validateParams(schema: ZodType) {
  return validate(schema, 'params');
}
