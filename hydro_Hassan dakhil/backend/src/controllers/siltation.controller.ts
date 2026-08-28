import { NextFunction, Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { siltationService } from "../services/siltation.service";

function qDamCode(req: Request): string {
  const raw = req.query.damCode;
  if (typeof raw === "string" && raw.trim()) {
    const normalized = raw.trim().toUpperCase();
    if (!/^[A-Z0-9_-]+$/.test(normalized)) {
      throw new AppError("Invalid damCode parameter.", 400);
    }
    return normalized;
  }
  return "HASSAN_ADDAKHIL";
}

export class SiltationController {
  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getSummary(qDamCode(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async indicators(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getIndicators(qDamCode(req));
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async hsv(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getHsv(qDamCode(req));
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async evolution(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getEvolution(qDamCode(req));
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async bathymetry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getBathymetry(qDamCode(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async availability(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getAvailability(qDamCode(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async bathymetryCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getBathymetryCampaignsPackage(qDamCode(req));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async periodVolumes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await siltationService.getPeriodVolumes(qDamCode(req));
      res.json({ success: true, data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const damCode = qDamCode(req);
      const file = await siltationService.exportExcelBuffer(damCode);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"siltation_${damCode.toLowerCase()}.xlsx\"`
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.send(file);
    } catch (error) {
      next(error);
    }
  }

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const damCode = qDamCode(req);
      const file = await siltationService.exportPdfBuffer(damCode);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"siltation_${damCode.toLowerCase()}.pdf\"`
      );
      res.setHeader("Content-Type", "application/pdf");
      res.send(file);
    } catch (error) {
      next(error);
    }
  }
}

export const siltationController = new SiltationController();
