import {
  buildSeedBatches,
  buildSeedLeads,
  SEED_BDES,
  SEED_CREDITS,
  SEED_TEAM,
  TODAY,
} from "./seedData.js";

class LeadGenStore {
  constructor() {
    const leads = buildSeedLeads();
    this.state = {
      leads,
      bdes: [...SEED_BDES],
      credits: { ...SEED_CREDITS },
      team: [...SEED_TEAM],
      batches: buildSeedBatches(leads),
      dateRange: "Last 30 Days",
      nextId: leads.length + 1,
    };
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
    if (filters?.researcher) {
      result = result.filter((l) => l.uploadedBy === filters.researcher);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.company.toLowerCase().includes(q) ||
          l.contact.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q),
      );
    }

    const total = result.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? total;

    return {
      items: result.slice(offset, offset + limit),
      total,
    };
  }

  getLeadById(id) {
    return this.state.leads.find((l) => l.id === id);
  }

  approveLeads(ids) {
    const idSet = new Set(ids);
    let count = 0;

    this.state.leads = this.state.leads.map((l) => {
      if (idSet.has(l.id) && l.status === "pending") {
        count++;
        return { ...l, status: "approved", reviewedOn: TODAY };
      }
      return l;
    });

    return { updatedCount: count };
  }

  rejectLeads(ids, reason) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) throw new Error("A rejection reason is required.");

    const idSet = new Set(ids);
    let count = 0;

    this.state.leads = this.state.leads.map((l) => {
      if (idSet.has(l.id) && l.status === "pending") {
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

    return { updatedCount: count };
  }

  allocateCredits(bde, amount) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error("Amount must be a positive integer.");
    }
    const targetBde = this.state.bdes.find((b) => b.name === bde);
    if (!targetBde) {
      throw new Error(`BDE ${bde} not found.`);
    }

    targetBde.allocated += amount;
    this.state.credits.allocated += amount;

    return { bde: targetBde, credits: this.state.credits };
  }

  getTeam() {
    return this.state.team;
  }

  addTeamMember(member) {
    if (!member.name?.trim() || !member.email?.trim()) {
      throw new Error("Member name and email are required.");
    }
    this.state.team.push(member);
    if (member.role === "BDE") {
      this.state.bdes.push({
        name: member.name,
        allocated: 0,
        used: 0,
        connected: 0,
        interested: 0,
      });
    }
    return member;
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

  addBatch(batch, rows) {
    const fresh = rows.map((r, i) => ({
      ...r,
      id: this.state.nextId + i,
      status: "pending",
      uploadedBy: batch.researcher,
      uploadedOn: batch.uploadedOn,
      batchId: batch.id,
    }));

    this.state.leads = [...fresh, ...this.state.leads];
    this.state.batches = [{ ...batch, draft: false }, ...this.state.batches];
    this.state.nextId += fresh.length;

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
      creditsAvailable: allocated - used,
      utilization: allocated === 0 ? 0 : Math.round((used / allocated) * 100),
    };
  }

  unlockLead(id, bde) {
    const lead = this.state.leads.find((l) => l.id === id);
    if (!lead) throw new Error("Lead not found");
    const UNLOCK_COST = 5;
    if (this.state.credits.allocated - this.state.credits.used < UNLOCK_COST) {
      throw new Error("Insufficient credits");
    }
    this.state.credits.used += UNLOCK_COST;
    const bdeEntry = this.state.bdes.find((b) => b.name === bde);
    if (bdeEntry) bdeEntry.used = (bdeEntry.used || 0) + UNLOCK_COST;

    lead.unlockedBy = lead.unlockedBy || [];
    if (!lead.unlockedBy.includes(bde)) lead.unlockedBy.push(bde);

    this.state.creditLog = this.state.creditLog || [];
    this.state.creditLog.unshift({
      id: Date.now(),
      bde,
      amount: UNLOCK_COST,
      type: "deduct",
      reason: `Unlocked ${lead.company}`,
      date: new Date().toISOString().slice(0, 10),
    });

    return lead;
  }

  updateLead(id, updates) {
    const lead = this.state.leads.find((l) => l.id === id);
    if (!lead) throw new Error("Lead not found");
    Object.assign(lead, updates);
    return lead;
  }

  requestCredits(bde, amount, reason) {
    this.state.creditRequests = this.state.creditRequests || [];
    const req = {
      id: Date.now(),
      bde,
      amount,
      reason,
      status: "pending",
      requestedOn: new Date().toISOString().slice(0, 10),
    };
    this.state.creditRequests.unshift(req);
    return req;
  }
}

export const leadStore = new LeadGenStore();
