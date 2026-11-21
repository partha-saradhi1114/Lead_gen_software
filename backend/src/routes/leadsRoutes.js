import { Router } from "express";
import { leadService } from "../services/leadService.js";

export const leadsRouter = Router();

// GET /api/leads - Filtered leads list
leadsRouter.get("/", async (req, res) => {
  try {
    const { status, source, category, researcher, assignedBde, search, limit, offset } = req.query;
    const data = await leadService.getLeads({
      status: status ? String(status) : undefined,
      source: source ? String(source) : undefined,
      category: category ? String(category) : undefined,
      researcher: researcher ? String(researcher) : undefined,
      assignedBde: assignedBde ? String(assignedBde) : undefined,
      search: search ? String(search) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch leads" });
  }
});

// GET /api/leads/full-state - Initial frontend hydration
leadsRouter.get("/full-state", async (_req, res) => {
  try {
    const state = await leadService.getFullState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch full state" });
  }
});

// GET /api/leads/batches - Upload batch history
leadsRouter.get("/batches", async (_req, res) => {
  try {
    const batches = await leadService.getBatches();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch batches" });
  }
});

// GET /api/leads/credits - BDE credits overview
leadsRouter.get("/credits", async (_req, res) => {
  try {
    const credits = await leadService.getCredits();
    res.json(credits);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch credits" });
  }
});

// POST /api/leads/credits/request - BDE requests credit top-up (MUST BE BEFORE /:id)
leadsRouter.post("/credits/request", async (req, res) => {
  try {
    const { bde, amount, reason } = req.body;
    if (!bde) return res.status(400).json({ error: "bde name is required" });
    if (!amount || amount <= 0) return res.status(400).json({ error: "positive amount required" });
    const result = await leadService.requestCredits(bde, amount, reason);
    res.json({ message: "Credit request submitted successfully", request: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to request credits" });
  }
});

// POST /api/leads/approve - Approve leads in bulk
leadsRouter.post("/approve", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }
    const result = await leadService.approveLeads(ids);
    res.json({ message: "Leads approved successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to approve leads" });
  }
});

// POST /api/leads/reject - Reject leads with admin reason
leadsRouter.post("/reject", async (req, res) => {
  try {
    const { ids, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    const result = await leadService.rejectLeads(ids, reason);
    res.json({ message: "Leads rejected successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to reject leads" });
  }
});

// POST /api/leads/allocate - Allocate credits to a BDE
leadsRouter.post("/allocate", async (req, res) => {
  try {
    const { bde, amount } = req.body;
    if (!bde) return res.status(400).json({ error: "bde name or id is required" });
    if (!amount || amount <= 0) return res.status(400).json({ error: "positive amount required" });
    const result = await leadService.allocateCredits(bde, amount);
    res.json({ message: "Credits allocated successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to allocate credits" });
  }
});

// POST /api/leads/assign - Assign approved leads to a BDE
leadsRouter.post("/assign", async (req, res) => {
  try {
    const { leadIds, bde } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: "leadIds array is required" });
    }
    if (!bde) {
      return res.status(400).json({ error: "bde name is required" });
    }
    const result = await leadService.assignLeads(leadIds, bde);
    res.json({ message: "Leads assigned successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to assign leads" });
  }
});

// POST /api/leads/upload - Save an uploaded Excel batch
leadsRouter.post("/upload", async (req, res) => {
  try {
    const { batch, rows } = req.body;
    if (!batch || !Array.isArray(rows)) {
      return res.status(400).json({ error: "batch and rows array are required" });
    }
    const result = await leadService.uploadBatch(batch, rows);
    res.status(201).json({ message: "Batch uploaded successfully", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to upload batch" });
  }
});

// GET /api/leads/:id - Single lead detail
leadsRouter.get("/:id", async (req, res) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch lead" });
  }
});

// POST /api/leads/:id/unlock - BDE unlocks contact details
leadsRouter.post("/:id/unlock", async (req, res) => {
  try {
    const { bde } = req.body;
    if (!bde) return res.status(400).json({ error: "bde name is required" });
    const result = await leadService.unlockLead(req.params.id, bde);
    res.json({ message: "Lead unlocked successfully", lead: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to unlock lead" });
  }
});

// PATCH /api/leads/:id - Update stage, notes, follow-up date
leadsRouter.patch("/:id", async (req, res) => {
  try {
    const result = await leadService.updateLead(req.params.id, req.body);
    res.json({ message: "Lead updated successfully", lead: result });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update lead" });
  }
});
