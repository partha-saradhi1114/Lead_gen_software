import { toast } from "sonner";
import { UNLOCK_COST } from "@/lib/leadgen/bde";

export function useUnlock({ dispatch, bde, kpis }) {
  return (row) => {
    if (kpis.available < UNLOCK_COST)
      return void toast.error("No credits left. Request more from the Credits page.");
    dispatch({ type: "bdeUnlock", bde, leadId: row.leadId });
    toast.success(`Contact unlocked · ${UNLOCK_COST} credit used`);
  };
}
