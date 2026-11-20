import { Router } from "express";
import { leadService } from "../services/leadService.js";

export const teamRouter = Router();

teamRouter.get("/", (_req, res) => {
  try {
    res.json(leadService.getTeam());
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch team" });
  }
});

teamRouter.post("/", (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "name, email, and role are required" });
    }
    const member = leadService.addTeamMember({ name, email, phone: phone || "", role });
    res.status(201).json({ message: "Team member added", member });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add team member" });
  }
});

teamRouter.get("/bdes", (_req, res) => {
  try {
    res.json(leadService.getBdes());
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch BDEs" });
  }
});
