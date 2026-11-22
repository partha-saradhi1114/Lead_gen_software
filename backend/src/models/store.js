import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSeedBatches,
  buildSeedLeads,
  isoDaysBefore,
  SEED_BDES,
  SEED_CREDITS,
  SEED_TEAM,
  TODAY,
} from "./seedData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, "../../data/leadgen_local_db.json");

function buildSeedAssignments(leads, bdes) {
  const approved = leads.filter((l) => l.status === "approved");
  const out = [];
  const pattern = [
    "New", "New", "Contacted", "Connected", "Interested", "Not Interested", "Contacted", "Converted", "New", "Connected",
  ];
  bdes.forEach((b, bi) => {
    const mine = approved.slice(bi * 48, bi * 48 + 48);
    mine.forEach((l, i) => {
      const stage = pattern[i % pattern.length];
      const assignedOn = isoDaysBefore(TODAY, (i % 14) + 1);
      const due =
        i % 3 === 0 &&
        stage !== "Not Interested" &&
        stage !== "Converted" &&
        stage !== "New"
          ? {
              on: isoDaysBefore(TODAY, (i % 7) - 3),
              note: "Call back to discuss requirement",
              done: false,
            }
          : null;
      out.push({
        leadId: l.id,
        bde: b.name,
        assignedOn,
        stage,
        unlocked: stage !== "New",
        followUp: due,
        activity: [
          { on: assignedOn, text: "Lead assigned by Master Admin" },
          ...(stage !== "New"
            ? [{ on: assignedOn, text: `Marked ${stage}` }]
            : []),
        ],
      });
    });
  });
  return out;
}

class LeadGenStore {
  constructor() {
    this.state = this.loadInitialState();
  }

  loadInitialState() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.leads) && parsed.leads.length > 0) {
          const LEAD_CATS = [
            "Students / Education",
            "IT & Upskilling",
            "Corporate Training",
            "Healthcare & Pharma",
            "General Enquiries",
          ];
          parsed.leads = parsed.leads.map((l, i) => ({
            ...l,
            category:
              l.category ||
              (l.industry === "Higher Education" ||
              l.company?.includes("University") ||
              l.company?.includes("College")
                ? "Students / Education"
                : LEAD_CATS[i % LEAD_CATS.length]),
          }));
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[Store] Error loading local db file, seeding fresh state:", e.message);
    }

    const leads = buildSeedLeads();
    const initialState = {
      leads,
      bdes: [...SEED_BDES],
      credits: { ...SEED_CREDITS },
      team: [...SEED_TEAM],
      batches: buildSeedBatches(leads),
      assignments: buildSeedAssignments(leads, SEED_BDES),
      dateRange: "Last 30 Days",
      nextId: leads.length + 1,
      creditLog: [],
      creditRequests: [],
      settings: {
        general: {
          workspaceName: "Lead Generation Software",
          orgDomain: "leadgen.pro",
          contactEmail: "admin@leadgen.pro",
          timezone: "Asia/Kolkata",
          currency: "INR",
        },
        credits: {
          costPerUnlock: 10,
          defaultMonthlyQuota: 500,
          lowCreditThreshold: 50,
          autoDebitOnUnlock: true,
          requireApprovalForTopup: false,
        },
        rules: {
          strictPhoneValidation: true,
          requireBusinessEmail: true,
          autoDeduplicate: true,
          maxBatchSize: 500,
          autoArchiveRejectedAfterDays: 30,
        },
        notifications: {
          emailOnUpload: true,
          emailOnReview: false,
          lowCreditAlerts: true,
          dailyDigest: true,
          inAppPopups: true,
        },
      },
    };

    this.persistState(initialState);
    return initialState;
  }

  persistState(stateToSave = this.state) {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(stateToSave, null, 2), "utf-8");
    } catch (e) {
      // Non-blocking in sandboxed environments
    }
  }

  getState() {
    return this.state;
  }

  getLeads(filters) {
    let result = this.state.leads;

    if (filters?.status) {
      result = result.filter((l) => l.status === filters.status);
    }
    if (filters?.source) {
      result = result.filter((l) => l.source === filters.source);
    }
    if (filters?.category) {
      result = result.filter((l) => l.category === filters.category);
    }
    if (filters?.researcher) {
      result = result.filter(
        (l) => l.uploadedBy === filters.researcher || l.uploaderName === filters.researcher
      );
    }
    if (filters?.assignedBde) {
      result = result.filter(
        (l) => l.assignedName === filters.assignedBde || l.assignedTo === filters.assignedBde
      );
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.company && l.company.toLowerCase().includes(q)) ||
          (l.contact && l.contact.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.phone && l.phone.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? total;

    return {
      items: result.slice(offset, offset + limit),
      total,
      limit,
      offset,
    };
  }

  getLeadById(id) {
    const numericId = Number(id);
    return this.state.leads.find((l) => l.id === id || l.id === numericId);
  }

  approveLeads(ids) {
    const idSet = new Set(ids.map((id) => (typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id)));
    let count = 0;

    this.state.leads = this.state.leads.map((l) => {
      if ((idSet.has(l.id) || idSet.has(String(l.id))) && l.status === "pending") {
        count++;
        return { ...l, status: "approved", reviewedOn: TODAY };
      }
      return l;
    });

    this.persistState();
    return { updatedCount: count, approvedIds: ids };
  }

  rejectLeads(ids, reason) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) throw new Error("A rejection reason is required.");

    const idSet = new Set(ids.map((id) => (typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id)));
    let count = 0;

    this.state.leads = this.state.leads.map((l) => {
      if ((idSet.has(l.id) || idSet.has(String(l.id))) && l.status === "pending") {
        count++;
        return {
          ...l,
          status: "rejected",
          rejectionReason: trimmedReason,
          reviewedOn: TODAY,
        };
      }
      return l;
    });

    this.persistState();
    return { updatedCount: count, rejectedIds: ids, reason: trimmedReason };
  }

  allocateCredits(bde, amount) {
    const numAmount = Number(amount);
    if (!Number.isInteger(numAmount) || numAmount <= 0) {
      throw new Error("Amount must be a positive integer.");
    }
    const targetBde = this.state.bdes.find((b) => b.name === bde);
    if (!targetBde) {
      throw new Error(`BDE '${bde}' not found.`);
    }

    targetBde.allocated += numAmount;
    this.state.credits.allocated += numAmount;

    // If there was a pending credit request for this BDE, mark it approved
    if (Array.isArray(this.state.creditRequests)) {
      const pendingReq = this.state.creditRequests.find(
        (r) => r.bde === bde && r.status === "pending"
      );
      if (pendingReq) {
        pendingReq.status = "approved";
      }
    }

    this.state.creditLog = this.state.creditLog || [];
    this.state.creditLog.unshift({
      on: TODAY,
      bde,
      kind: "Allocation",
      amount: numAmount,
      note: `Master Admin allocated ${numAmount} credits`,
    });

    this.persistState();
    return { bde: targetBde.name, allocated: numAmount, credits: this.state.credits };
  }

  assignLeads(leadIds, bde) {
    const idSet = new Set(leadIds.map((id) => (typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id)));
    let count = 0;
    const todayIso = new Date().toISOString().slice(0, 10);

    this.state.leads = this.state.leads.map((l) => {
      if (idSet.has(l.id) || idSet.has(String(l.id))) {
        count++;
        return {
          ...l,
          assignedTo: bde,
          assignedName: bde,
          assignedOn: todayIso,
        };
      }
      return l;
    });

    // Also update assignments list for BDE view
    this.state.assignments = this.state.assignments || [];
    for (const leadId of leadIds) {
      const matchIdx = this.state.assignments.findIndex((a) => a.leadId === leadId || a.leadId === Number(leadId));
      if (matchIdx >= 0) {
        this.state.assignments[matchIdx] = {
          ...this.state.assignments[matchIdx],
          bde,
          assignedOn: todayIso,
        };
      } else {
        this.state.assignments.push({
          leadId: typeof leadId === "string" && !isNaN(Number(leadId)) ? Number(leadId) : leadId,
          bde,
          assignedOn: todayIso,
          stage: "New",
          unlocked: false,
          followUp: null,
          activity: [
            { on: todayIso, text: `Lead assigned by Master Admin to ${bde}` },
          ],
        });
      }
    }

    this.persistState();
    return { modifiedCount: count, bde, leadIds };
  }

  getTeam() {
    return this.state.team;
  }

  addTeamMember(member) {
    if (!member.name?.trim() || !member.email?.trim()) {
      throw new Error("Member name and email are required.");
    }
    const cleanMember = {
      id: Date.now().toString(),
      name: member.name.trim(),
      email: member.email.trim().toLowerCase(),
      phone: member.phone || "+91 90000 00000",
      role: member.role || "BDE",
      department:
        member.department ||
        (member.role === "BDE"
          ? "Business Development"
          : "Market Research"),
      status: member.status || "Active",
      credits: member.role === "BDE" ? 500 : 0,
      creditsUsed: 0,
      active: (member.status || "Active").toLowerCase() === "active",
    };
    this.state.team.push(cleanMember);
    if (cleanMember.role === "BDE") {
      this.state.bdes.push({
        name: cleanMember.name,
        allocated: 500,
        used: 0,
        connected: 0,
        interested: 0,
      });
      this.state.credits.allocated += 500;
    }
    this.persistState();
    return cleanMember;
  }

  getBdes() {
    return this.state.bdes;
  }

  getBatches() {
    return this.state.batches;
  }

  getCredits() {
    return this.state.credits;
  }

  addBatch(batch, rows = []) {
    const fresh = rows.map((r, i) => ({
      ...r,
      id: this.state.nextId + i,
      status: "pending",
      uploadedBy: batch.uploadedBy || batch.researcher || "Research Analyst",
      uploaderName: batch.uploadedBy || batch.researcher || "Research Analyst",
      uploadedOn: batch.uploadedOn || TODAY,
      batchId: batch.id,
      category: r.category || batch.category || "Students / Education",
    }));

    this.state.leads = [...fresh, ...this.state.leads];
    this.state.batches = [{ ...batch, draft: false, validRecords: fresh.length }, ...this.state.batches];
    this.state.nextId += fresh.length;

    this.persistState();
    return { batch, count: fresh.length };
  }

  getKpis() {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const l of this.state.leads) {
      if (l.status === "pending") pending++;
      else if (l.status === "approved") approved++;
      else rejected++;
    }

    const { allocated, used } = this.state.credits;
    return {
      total: this.state.leads.length,
      pending,
      approved,
      rejected,
      creditsAllocated: allocated,
      creditsUsed: used,
      creditsAvailable: Math.max(0, allocated - used),
      utilization: allocated === 0 ? 0 : Math.round((used / allocated) * 100),
    };
  }

  unlockLead(id, bde) {
    const numericId = Number(id);
    const lead = this.state.leads.find((l) => l.id === id || l.id === numericId);
    if (!lead) throw new Error("Lead not found");

    const UNLOCK_COST = 1;
    const bdeEntry = this.state.bdes.find((b) => b.name === bde);
    if (bdeEntry && (bdeEntry.allocated - bdeEntry.used < UNLOCK_COST)) {
      throw new Error("Insufficient credits to unlock contact.");
    }

    if (bdeEntry) {
      bdeEntry.used += UNLOCK_COST;
    }
    this.state.credits.used += UNLOCK_COST;

    lead.unlockedBy = lead.unlockedBy || [];
    if (!lead.unlockedBy.includes(bde)) lead.unlockedBy.push(bde);

    // Update assignment record if exists
    this.state.assignments = this.state.assignments || [];
    const assignment = this.state.assignments.find(
      (a) => (a.leadId === id || a.leadId === numericId) && a.bde === bde
    );
    if (assignment) {
      assignment.unlocked = true;
      assignment.activity = assignment.activity || [];
      assignment.activity.push({
        on: TODAY,
        text: `Contact unlocked (${UNLOCK_COST} credit)`,
      });
    }

    this.state.creditLog = this.state.creditLog || [];
    this.state.creditLog.unshift({
      on: TODAY,
      bde,
      kind: "Used",
      amount: UNLOCK_COST,
      leadId: lead.id,
      note: `Unlocked ${lead.company}`,
    });

    this.persistState();
    return lead;
  }

  updateLead(id, updates) {
    const numericId = Number(id);
    const lead = this.state.leads.find((l) => l.id === id || l.id === numericId);
    if (!lead) throw new Error("Lead not found");

    Object.assign(lead, updates);

    // Also update assignment if stage or notes are updated
    this.state.assignments = this.state.assignments || [];
    const assignment = this.state.assignments.find(
      (a) => a.leadId === id || a.leadId === numericId
    );
    if (assignment) {
      if (updates.stage) assignment.stage = updates.stage;
      if (updates.followUpDone && assignment.followUp) {
        assignment.followUp.done = true;
        assignment.followUp.doneOn = TODAY;
      }
      if (updates.followUpDate || updates.followUpOn) {
        assignment.followUp = {
          on: updates.followUpDate || updates.followUpOn,
          note: updates.notes || updates.note || "Follow up",
          done: false,
        };
      }
    }

    this.persistState();
    return lead;
  }

  getSettings() {
    return this.state.settings;
  }

  updateSettings(section, values) {
    if (!this.state.settings) this.state.settings = {};
    this.state.settings[section] = {
      ...(this.state.settings[section] || {}),
      ...values,
    };
    this.persistState();
    return this.state.settings;
  }

  requestCredits(bde, amount, reason) {
    this.state.creditRequests = this.state.creditRequests || [];
    const req = {
      id: Date.now(),
      bde,
      amount: Number(amount),
      reason,
      status: "pending",
      requestedOn: new Date().toISOString().slice(0, 10),
    };
    this.state.creditRequests.unshift(req);

    this.state.creditLog = this.state.creditLog || [];
    this.state.creditLog.unshift({
      on: TODAY,
      bde,
      kind: "Requested",
      amount: Number(amount),
      note: reason || "Credit top-up request",
    });

    this.persistState();
    return req;
  }
}

export const leadStore = new LeadGenStore();
