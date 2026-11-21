import { useMemo } from "react";
import { useLeadGen } from "@/lib/leadgen/store";
import { CURRENT_RA } from "@/lib/leadgen/data";
import { batchCounts, batchStatus, selectRaKpis } from "@/lib/leadgen/reducer";

/** Leads and batches belonging to the signed-in Research Analyst (sample identity for now). */
export function useRaData() {
  const { state, dispatch } = useLeadGen();
  return useMemo(() => {
    const leads = state.leads.filter((l) => l.uploadedBy === CURRENT_RA);
    const batches = state.batches
      .filter((b) => b.researcher === CURRENT_RA)
      .map((b) => {
        const c = batchCounts(leads, b.id);
        return { ...b, ...c, status: batchStatus(b, c) };
      });
    return {
      leads,
      batches,
      kpis: selectRaKpis(state, CURRENT_RA),
      state,
      dispatch,
    };
  }, [state, dispatch]);
}
