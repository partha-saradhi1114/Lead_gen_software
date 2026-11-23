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
    const { name, email, role, phone, password, department, category, status } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "name, email, and role are required" });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim()) || email.includes("..") || email.includes(" ")) {
      return res.status(400).json({ error: "Please enter a valid email address in proper format" });
    }

    // Validate mobile number if provided
    let formattedPhone = phone;
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      if (/[a-zA-Z]/.test(cleanPhone)) {
        return res.status(400).json({ error: "Mobile number cannot contain alphabets" });
      }
      let digits = cleanPhone.replace(/\D/g, "");
      if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
      else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
      if (digits.length !== 10) {
        return res.status(400).json({ error: `Mobile number must consist of exactly 10 digits (currently ${digits.length})` });
      }
      if (!/^[6-9]/.test(digits)) {
        return res.status(400).json({ error: "Mobile number must start with 6, 7, 8, or 9" });
      }
      formattedPhone = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    const finalCategory = category || department || "Student/Corporate training";

    const member = await leadService.addTeamMember({
      name,
      email,
      role,
      phone: formattedPhone,
      password,
      category: finalCategory,
      department: finalCategory,
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
    const bdes = await leadService.getBdes();
    res.json(bdes);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch BDEs" });
  }
});
