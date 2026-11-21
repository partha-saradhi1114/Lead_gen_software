import { Router } from "express";
import { leadService } from "../services/leadService.js";

export const statsRouter = Router();

statsRouter.get("/kpis", async (_req, res) => {
  try {
    const kpis = await leadService.getKpis();
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch KPIs" });
  }
});
