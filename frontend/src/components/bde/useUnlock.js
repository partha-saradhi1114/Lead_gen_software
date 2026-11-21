import { toast } from "sonner";
import { UNLOCK_COST } from "@/lib/leadgen/bde";
import { api } from "@/lib/api";

export function useUnlock({ dispatch, bde, kpis }) {
  return (row) => {
    if (kpis.available < UNLOCK_COST)
      return void toast.error(
        "No credits left. Request more from the Credits page.",
      );
    dispatch({ type: "bdeUnlock", bde, leadId: row.leadId });
    api
      .unlockLead(row.leadId, bde)
      .catch((err) =>
        console.warn("[API] unlockLead sync failed:", err.message),
      );
    toast.success(`Contact unlocked · ${UNLOCK_COST} credit used`);
  };
}
