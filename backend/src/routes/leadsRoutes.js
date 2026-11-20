import { Router } from "express";
import { leadService } from "../services/leadService.js";

export const leadsRouter = Router();

leadsRouter.get("/", (req, res) => {
  try {
    const { status, source, researcher, search, limit, offset } = req.query;
    const data = leadService.getLeads({
      status: status ? String(status) : undefined,
      source: source ? String(source) : undefined,
      researcher: researcher ? String(researcher) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch leads" });
  }
});

leadsRouter.get("/full-state", (_req, res) => {
  try {
    const state = leadService.getFullState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch full state" });
  }
});

leadsRouter.get("/batches", (_req, res) => {
  try {
    const batches = leadService.getBatches();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch batches" });
  }
});

leadsRouter.get("/credits", (_req, res) => {
  try {
    const credits = leadService.getCredits();
    res.json(credits);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch credits" });
  }
});

leadsRouter.get("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const lead = leadService.getLeadById(id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch lead" });
  }
});

leadsRouter.post("/approve", (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }
    const result = leadService.approveLeads(ids);
    res.json({ message: "Leads approved successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to approve leads" });
  }
});

leadsRouter.post("/reject", (req, res) => {
  try {
    const { ids, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    const result = leadService.rejectLeads(ids, reason);
    res.json({ message: "Leads rejected successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reject leads" });
  }
});

leadsRouter.post("/allocate", (req, res) => {
  try {
    const { bde, amount } = req.body;
    if (!bde) return res.status(400).json({ error: "bde name is required" });
    if (!amount || amount <= 0) return res.status(400).json({ error: "positive amount required" });
    const result = leadService.allocateCredits(bde, amount);
    res.json({ message: "Credits allocated successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to allocate credits" });
  }
});

leadsRouter.post("/upload", (req, res) => {
  try {
    const { batch, rows } = req.body;
    if (!batch || !Array.isArray(rows)) {
      return res.status(400).json({ error: "batch and rows array are required" });
    }
    const result = leadService.uploadBatch(batch, rows);
    res.status(201).json({ message: "Batch uploaded successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to upload batch" });
  }
});

leadsRouter.post("/credits/request", (req, res) => {
  try {
    const { bde, amount, reason } = req.body;
    if (!bde || !amount) return res.status(400).json({ error: "bde and amount are required" });
    const result = leadService.requestCredits(bde, Number(amount), reason);
    res.json({ message: "Credit request submitted", request: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to submit credit request" });
  }
});

leadsRouter.post("/:id/unlock", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { bde } = req.body;
    if (!bde) return res.status(400).json({ error: "bde name is required" });
    const result = leadService.unlockLead(id, bde);
    res.json({ message: "Lead unlocked successfully", lead: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to unlock lead" });
  }
});

leadsRouter.patch("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = leadService.updateLead(id, req.body);
    res.json({ message: "Lead updated successfully", lead: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update lead" });
  }
});
