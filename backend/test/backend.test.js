import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { leadService } from "../src/services/leadService.js";
import { leadStore } from "../src/models/store.js";

describe("Backend Lead Service & Store Integration", () => {
  it("fetches full initial state with all expected fields", async () => {
    const state = await leadService.getFullState();
    assert.ok(Array.isArray(state.leads));
    assert.ok(state.leads.length >= 4000);
    assert.ok(Array.isArray(state.bdes));
    assert.ok(state.bdes.length >= 4);
    assert.ok(Array.isArray(state.batches));
    assert.ok(Array.isArray(state.team));
    assert.ok(state.credits && typeof state.credits.allocated === "number");
    assert.ok(state.settings && state.settings.general);
  });

  it("calculates accurate KPIs from lead state", async () => {
    const kpis = await leadService.getKpis();
    assert.ok(kpis.total >= 4000);
    assert.equal(kpis.total, kpis.pending + kpis.approved + kpis.rejected);
    assert.ok(kpis.creditsAllocated >= 2000);
    assert.ok(kpis.creditsUsed >= 0);
  });

  it("approves pending leads in bulk", async () => {
    const state = await leadService.getFullState();
    const pendingLeads = state.leads.filter((l) => l.status === "pending").slice(0, 2);
    assert.equal(pendingLeads.length, 2, "Need 2 pending leads for approval test");

    const idsToApprove = pendingLeads.map((l) => l.id);
    const res = await leadService.approveLeads(idsToApprove);
    assert.equal(res.updatedCount, 2);

    const checkLead = await leadService.getLeadById(idsToApprove[0]);
    assert.equal(checkLead.status, "approved");
  });

  it("rejects leads with a validated rejection reason", async () => {
    const state = await leadService.getFullState();
    const pendingLead = state.leads.find((l) => l.status === "pending");
    assert.ok(pendingLead, "Need a pending lead for rejection test");

    const res = await leadService.rejectLeads([pendingLead.id], "Invalid phone number format");
    assert.equal(res.updatedCount, 1);

    const checkLead = await leadService.getLeadById(pendingLead.id);
    assert.equal(checkLead.status, "rejected");
    assert.equal(checkLead.rejectionReason, "Invalid phone number format");
  });

  it("allocates credits to a target BDE", async () => {
    const prevAllocated = leadStore.getCredits().allocated;
    const res = await leadService.allocateCredits("Ravi Kumar", 100);
    assert.equal(res.bde, "Ravi Kumar");
    assert.equal(res.allocated, 100);
    assert.equal(leadStore.getCredits().allocated, prevAllocated + 100);
  });

  it("assigns approved leads to a BDE and records assignments", async () => {
    const state = await leadService.getFullState();
    const approvedLeads = state.leads.filter((l) => l.status === "approved").slice(0, 2);
    const ids = approvedLeads.map((l) => l.id);

    const res = await leadService.assignLeads(ids, "Ravi Kumar");
    assert.equal(res.modifiedCount, ids.length);
    assert.equal(res.bde, "Ravi Kumar");

    const checkLead = await leadService.getLeadById(ids[0]);
    assert.equal(checkLead.assignedName, "Ravi Kumar");
  });

  it("unlocks lead contact details and deducts credit", async () => {
    const state = await leadService.getFullState();
    const leadToUnlock = state.leads.find((l) => l.status === "approved");
    assert.ok(leadToUnlock);

    const lead = await leadService.unlockLead(leadToUnlock.id, "Ravi Kumar");
    assert.ok(lead.unlockedBy.includes("Ravi Kumar"));
  });

  it("updates lead pipeline stage and follow-up date", async () => {
    const state = await leadService.getFullState();
    const lead = state.leads[0];

    const updated = await leadService.updateLead(lead.id, {
      stage: "interested",
      notes: "Client requested quotation",
      followUpDate: "2026-11-25",
    });
    assert.equal(updated.stage, "interested");
    assert.equal(updated.notes, "Client requested quotation");
  });

  it("records and logs credit requests from BDEs", async () => {
    const req = await leadService.requestCredits("Ravi Kumar", 200, "High-volume hospital campaign");
    assert.equal(req.bde, "Ravi Kumar");
    assert.equal(req.amount, 200);
    assert.equal(req.status, "pending");
  });

  it("adds a new team member and initializes BDE quota if BDE", async () => {
    const newMember = await leadService.addTeamMember({
      name: "Suresh Reddy",
      email: "suresh.r@arahinfotech.com",
      role: "BDE",
      phone: "+91 99887 76655",
    });
    assert.equal(newMember.name, "Suresh Reddy");
    assert.equal(newMember.role, "BDE");
    const bde = leadStore.getBdes().find((b) => b.name === "Suresh Reddy");
    assert.ok(bde);
    assert.equal(bde.allocated, 500);
  });
});
