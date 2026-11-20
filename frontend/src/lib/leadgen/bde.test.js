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
const firstNew = (s) => s.assignments.find((a) => a.bde === CURRENT_BDE && a.stage === "New");

describe("BDE rules", () => {
  it("unlocking a contact costs one credit from the BDE and the pool", () => {
    const s = seed();
    const a = firstNew(s);
    const n = leadGenReducer(s, { type: "bdeUnlock", bde: CURRENT_BDE, leadId: a.leadId });
    expect(selectBdeKpis(n, CURRENT_BDE).used).toBe(421);
    expect(n.credits.used).toBe(1321);
  });
  it("cannot unlock when the BDE has no credits left", () => {
    const s = seed();
    s.bdes = s.bdes.map((b) => (b.name === CURRENT_BDE ? { ...b, used: b.allocated } : b));
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
    s = leadGenReducer(s, { type: "bdeUpdate", bde: CURRENT_BDE, leadId: id, stage: "Interested" });
    s = leadGenReducer(s, { type: "bdeUpdate", bde: CURRENT_BDE, leadId: id, stage: "Converted" });
    const row = s.bdes.find((b) => b.name === CURRENT_BDE);
    expect(row.connected).toBe(153);
    expect(row.interested).toBe(99);
  });
});
