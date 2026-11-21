import { useMemo } from "react";
import { useLeadGen } from "@/lib/leadgen/store";
import { CURRENT_RA } from "@/lib/leadgen/data";
import { batchCounts, batchStatus, selectRaKpis } from "@/lib/leadgen/reducer";

/** Leads and batches belonging to the signed-in Research Analyst (sample identity for now). */
export function useRaData() {
  const { state, dispatch } = useLeadGen();
  return useMemo(() => {
    const storedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    const ra =
      storedUser.role === "ra" && storedUser.name
        ? storedUser.name
        : CURRENT_RA;
    const leads = state.leads.filter(
      (l) =>
        l.uploadedBy === ra || l.researcher === ra || l.uploaderName === ra,
    );
    const batches = (state.batches || [])
      .filter((b) => b.researcher === ra || b.uploaderName === ra)
      .map((b) => {
        const c = batchCounts(leads, b.id || b.batchId);
        return { ...b, ...c, status: batchStatus(b, c) };
      });
    return {
      ra,
      leads,
      batches,
      kpis: selectRaKpis(state, ra),
      state,
      dispatch,
    };
  }, [state, dispatch]);
}
