import { Router } from "express";
import { leadService } from "../services/leadService.js";
import { User } from "../models/User.js";

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
    const { name, email, role, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "name, email, and role are required" });
    }
    const roleSlug = role.toLowerCase().includes("admin")
      ? "admin"
      : role.toLowerCase().includes("analyst") || role.toLowerCase().includes("ra")
        ? "ra"
        : "bde";

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || "Password@123",
      role: roleSlug,
      credits: roleSlug === "bde" ? 500 : 0,
    });

    res.status(201).json({
      message: "Team member added",
      member: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
      },
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
