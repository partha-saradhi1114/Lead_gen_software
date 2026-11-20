import { Router } from "express";
import { leadService } from "../services/leadService.js";

export const statsRouter = Router();

statsRouter.get("/kpis", (_req, res) => {
  try {
    res.json(leadService.getKpis());
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch KPIs" });
  }
});
