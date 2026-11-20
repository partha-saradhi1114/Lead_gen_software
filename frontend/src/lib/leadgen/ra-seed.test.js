import { describe, expect, it } from "vitest";
import { buildSeedBatches, buildSeedLeads, CURRENT_RA } from "./data";
import { selectRaKpis } from "./reducer";

describe("RA sample figures", () => {
  const leads = buildSeedLeads();
  const k = selectRaKpis({ leads, batches: buildSeedBatches(leads) }, CURRENT_RA);
  it("matches the agreed dashboard values", () => {
    expect(k).toEqual({ total: 1393, pending: 196, approved: 1120, rejected: 77, duplicates: 126 });
  });
  it("keeps duplicates out of the lead total", () => {
    expect(k.pending + k.approved + k.rejected).toBe(k.total);
  });
  it("approval rate is approved / (approved + rejected)", () => {
    expect(((k.approved / (k.approved + k.rejected)) * 100).toFixed(1)).toBe("93.6");
  });
});
