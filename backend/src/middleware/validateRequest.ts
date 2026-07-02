//src/middleware/validateRequests.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

// Schémas de validation
export const stationFilterSchema = z.object({
  stationIds: z.array(z.number()).optional(),
  limit: z.number().min(1).max(1000).optional(),
});

export const measurementFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(10000).optional(),
});

export const spatialBoundsSchema = z.object({
  minLng: z.number().min(-180).max(180),
  minLat: z.number().min(-90).max(90),
  maxLng: z.number().min(-180).max(180),
  maxLat: z.number().min(-90).max(90),
});

// Middleware de validation
export const validate = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
      }
      next(error);
    }
  };
};
