import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// Middleware للتحقق من صحة البيانات
export function validate(schema: {
  body?: ZodType<any>;
  params?: ZodType<any>;
  query?: ZodType<any>;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.params) {
        const parsedParams = await schema.params.parseAsync(req.params);
        // نحافظ على خصائص req.params
        Object.assign(req.params, parsedParams);
      }
      if (schema.query) {
        const parsedQuery = await schema.query.parseAsync(req.query);
        Object.assign(req.query, parsedQuery);
      }
      next();
    } catch (error: any) {
      if (error?.issues) {
        // Zod error (v4 uses `issues`)
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "بيانات غير صحيحة",
            details: error.issues.map((issue: any) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
        });
      }
      next(error);
    }
  };
}
