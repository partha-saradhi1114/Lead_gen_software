import { toast } from "sonner";
import { UNLOCK_COST } from "@/lib/leadgen/bde";
import { api } from "@/lib/api";

export function useUnlock({ dispatch, bde, kpis }) {
  return (row) => {
    if (kpis.available < UNLOCK_COST)
      return void toast.error(
        "No credits left. Request more from the Credits page.",
      );
    try {
      const bdeLower = (bde || "").toLowerCase();
      const bdeKey = `leadgen_unlocked_leads_${bdeLower}`;
      const existingBde = JSON.parse(localStorage.getItem(bdeKey) || "[]");
      const strId = String(row.leadId);
      if (!existingBde.includes(strId)) {
        existingBde.push(strId);
        localStorage.setItem(bdeKey, JSON.stringify(existingBde));
      }
      const existing = JSON.parse(
        localStorage.getItem("leadgen_unlocked_leads") || "[]",
      );
      if (!existing.includes(strId)) {
        existing.push(strId);
        localStorage.setItem(
          "leadgen_unlocked_leads",
          JSON.stringify(existing),
        );
      }
    } catch {
      // ignore storage quota errors
    }
    dispatch({ type: "bdeUnlock", bde, leadId: row.leadId });
    api
      .unlockLead(row.leadId, bde)
      .catch((err) =>
        console.warn("[API] unlockLead sync failed:", err.message),
      );
    toast.success(`Contact unlocked · ${UNLOCK_COST} credit used`);
  };
}
