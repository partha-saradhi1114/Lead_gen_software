import { describe, expect, it } from "vitest";
import { buildSeedBatches, buildSeedLeads, SEED_BDES, SEED_CREDITS, SEED_TEAM } from "./data";
import { leadGenReducer, selectKpis } from "./reducer";

const seed = () => {
  const leads = buildSeedLeads();
  return {
    leads,
    bdes: SEED_BDES,
    credits: SEED_CREDITS,
    team: SEED_TEAM,
    batches: buildSeedBatches(leads),
    dateRange: "Last 30 Days",
    nextId: leads.length + 1,
  };
};

describe("LeadGen admin rules", () => {
  it("starts with the brief's KPI figures", () => {
    const k = selectKpis(seed());
    expect(k).toMatchObject({
      total: 4280,
      pending: 620,
      approved: 3420,
      rejected: 240,
      creditsAllocated: 2000,
      creditsUsed: 1320,
      creditsAvailable: 680,
      utilization: 66,
    });
  });

  it("approving a pending lead moves it from Pending to Approved", () => {
    const k = selectKpis(leadGenReducer(seed(), { type: "approve", ids: [1, 2] }));
    expect(k.pending).toBe(618);
    expect(k.approved).toBe(3422);
  });

  it("rejecting needs a reason", () => {
    const s = seed();
    expect(leadGenReducer(s, { type: "reject", ids: [1], reason: "  " })).toBe(s);
    const next = leadGenReducer(s, { type: "reject", ids: [1], reason: "Duplicate lead" });
    expect(selectKpis(next).rejected).toBe(241);
    expect(next.leads.find((l) => l.id === 1)?.rejectionReason).toBe("Duplicate lead");
  });

  it("adding a BDE team member adds them to the BDE performance table", () => {
    const next = leadGenReducer(seed(), {
      type: "addMember",
      member: { name: "Sandeep Rao", email: "sandeep@arahinfotech.com", phone: "", role: "BDE" },
    });
    expect(next.team).toHaveLength(8);
    expect(next.bdes.map((b) => b.name)).toContain("Sandeep Rao");
  });

  it("allocating credits raises the BDE's and the total allocation", () => {
    const next = leadGenReducer(seed(), { type: "allocate", bde: "Ravi Kumar", amount: 100 });
    expect(next.bdes.find((b) => b.name === "Ravi Kumar")?.allocated).toBe(600);
    expect(selectKpis(next).creditsAllocated).toBe(2100);
  });
});

describe("Research Analyst rules", () => {
  it("submitting a batch adds its valid rows to the admin's pending review", () => {
    const s = seed();
    const next = leadGenReducer(s, {
      type: "submitBatch",
      batch: {
        id: "BT-TEST",
        fileName: "t.xlsx",
        uploadedOn: "2026-11-18",
        researcher: "Priya M",
        totalRecords: 3,
        validRecords: 2,
        invalidRecords: 1,
        duplicates: 0,
      },
      rows: [
        { company: "A", contact: "B", phone: "9000000001", email: "", source: "Web" },
        { company: "C", contact: "D", phone: "9000000002", email: "", source: "Web" },
      ],
    });
    expect(selectKpis(next).pending).toBe(622);
    expect(next.batches[0]?.id).toBe("BT-TEST");
  });

  it("resubmitting a rejected lead sends it back to pending and keeps the rejection history", () => {
    const s = seed();
    const rejected = s.leads.find((l) => l.status === "rejected");
    const next = leadGenReducer(s, {
      type: "resubmit",
      id: rejected.id,
      changes: { phone: "+91 90000 11111" },
    });
    const l = next.leads.find((x) => x.id === rejected.id);
    expect(l.status).toBe("pending");
    expect(l.history?.[0]?.reason).toBe(rejected.rejectionReason);
    expect(l.phone).toBe("+91 90000 11111");
  });
});
