import { sendError } from '../utils/response.js';

/**
 * Generic Zod Request Validation Middleware
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (!parsed.success) {
        return sendError(
          res,
          'Validation failed',
          400,
          parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        );
      }

      req.validatedData = parsed.data;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};
