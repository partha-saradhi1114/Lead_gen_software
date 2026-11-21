import { Router } from "express";
import { leadStore } from "../models/store.js";

export const settingsRouter = Router();

settingsRouter.get("/", (_req, res) => {
  res.json(leadStore.getSettings() || {});
});

settingsRouter.post("/", (req, res) => {
  const { section, values } = req.body;
  if (!section || !values) {
    return res.status(400).json({ error: "section and values are required" });
  }
  const updated = leadStore.updateSettings(section, values);
  res.json({ success: true, settings: updated });
});
