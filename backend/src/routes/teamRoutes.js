import { Router } from "express";
import { leadService } from "../services/leadService.js";

export const teamRouter = Router();

teamRouter.get("/", async (_req, res) => {
  try {
    const team = await leadService.getTeam();
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch team" });
  }
});

teamRouter.post("/", async (req, res) => {
  try {
    const { name, email, role, phone, password, department, status } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "name, email, and role are required" });
    }

    const member = await leadService.addTeamMember({
      name,
      email,
      role,
      phone,
      password,
      department,
      status,
    });

    res.status(201).json({
      message: "Team member added successfully",
      member,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to add team member" });
  }
});

teamRouter.get("/bdes", async (_req, res) => {
  try {
    const bdes = await leadService.getCredits();
    res.json(bdes);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch BDEs" });
  }
});
