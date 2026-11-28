import { describe, expect, it } from "vitest";
import { buildSeedLeads, SEED_BDES, SEED_CREDITS } from "./data";
import { buildSeedAssignments, CURRENT_BDE, selectBdeKpis } from "./bde";
import { leadGenReducer } from "./reducer";

const seed = () => {
  const leads = buildSeedLeads();
  return {
    leads,
    bdes: SEED_BDES,
    credits: SEED_CREDITS,
    assignments: buildSeedAssignments(leads, SEED_BDES),
    creditLog: [],
  };
};
const firstNew = (s) =>
  s.assignments.find((a) => a.bde === CURRENT_BDE && a.stage === "New");

describe("BDE rules", () => {
  it("unlocking a contact costs one credit from the BDE and the pool", () => {
    const s = seed();
    const a = firstNew(s);
    const n = leadGenReducer(s, {
      type: "bdeUnlock",
      bde: CURRENT_BDE,
      leadId: a.leadId,
    });
    expect(selectBdeKpis(n, CURRENT_BDE).used).toBe(421);
    expect(n.credits.used).toBe(1321);
  });
  it("cannot unlock when the BDE has no credits left", () => {
    const s = seed();
    s.bdes = s.bdes.map((b) =>
      b.name === CURRENT_BDE ? { ...b, used: b.allocated } : b,
    );
    const n = leadGenReducer(s, {
      type: "bdeUnlock",
      bde: CURRENT_BDE,
      leadId: firstNew(s).leadId,
    });
    expect(n).toBe(s);
  });
  it("a locked lead cannot change stage", () => {
    const s = seed();
    const n = leadGenReducer(s, {
      type: "bdeUpdate",
      bde: CURRENT_BDE,
      leadId: firstNew(s).leadId,
      stage: "Connected",
    });
    expect(n).toBe(s);
  });
  it("marking a lead Interested counts it once as connected and interested", () => {
    let s = seed();
    const id = firstNew(s).leadId;
    s = leadGenReducer(s, { type: "bdeUnlock", bde: CURRENT_BDE, leadId: id });
    s = leadGenReducer(s, {
      type: "bdeUpdate",
      bde: CURRENT_BDE,
      leadId: id,
      stage: "Interested",
    });
    s = leadGenReducer(s, {
      type: "bdeUpdate",
      bde: CURRENT_BDE,
      leadId: id,
      stage: "Converted",
    });
    const row = s.bdes.find((b) => b.name === CURRENT_BDE);
    expect(row.connected).toBe(153);
    expect(row.interested).toBe(99);
  });

  it("updates followUpDate, stage, and notes in assignments and state.leads", () => {
    let s = seed();
    const id = firstNew(s).leadId;
    s = leadGenReducer(s, { type: "bdeUnlock", bde: CURRENT_BDE, leadId: id });
    s = leadGenReducer(s, {
      type: "bdeUpdate",
      bde: CURRENT_BDE,
      leadId: id,
      stage: "Interested",
      note: "Meeting scheduled",
      followUpOn: "2026-11-27",
    });

    const assignment = s.assignments.find((a) => a.leadId === id);
    expect(assignment.followUp?.on).toBe("2026-11-27");
    expect(assignment.stage).toBe("Interested");

    const lead = s.leads.find((l) => l.id === id);
    expect(lead.followUpDate).toBe("2026-11-27");
    expect(lead.stage).toBe("Interested");
    expect(lead.notes).toBe("Meeting scheduled");
  });

  it("handles bdeRemindCall to flag lead as admin-reminded with urgent notification", () => {
    let s = seed();
    const id = firstNew(s).leadId;
    s = leadGenReducer(s, {
      type: "bdeRemindCall",
      leadId: id,
      bde: "giri",
      company: "gandhihospitals",
      contact: "naresh",
    });

    const lead = s.leads.find((l) => l.id === id);
    expect(lead.adminReminded).toBe(true);
    expect(lead.adminRemindNote).toBe("Immediate action required!");

    expect(s.notifications.length).toBeGreaterThan(0);
    const notif = s.notifications[0];
    expect(notif.targetUser).toBe("giri");
    expect(notif.title).toContain("Immediate action required");
    expect(notif.tone).toBe("red");

    // Multiple dispatches should deduplicate notifications and never duplicate
    s = leadGenReducer(s, {
      type: "bdeRemindCall",
      leadId: id,
      bde: "giri",
      company: "gandhihospitals",
      contact: "naresh",
    });
    const idNotifs = s.notifications.filter((n) => n.leadId === id);
    expect(idNotifs.length).toBe(1);
  });
});
