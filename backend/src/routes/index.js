import { Router } from "express";
import { leadsRouter } from "./leadsRoutes.js";
import { statsRouter } from "./statsRoutes.js";
import { teamRouter } from "./teamRoutes.js";

export const apiRouter = Router();

apiRouter.use("/leads", leadsRouter);
apiRouter.use("/team", teamRouter);
apiRouter.use("/stats", statsRouter);

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
