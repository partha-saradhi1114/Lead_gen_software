import { useMemo } from "react";
import { useLeadGen } from "@/lib/leadgen/store";
import { CURRENT_BDE, followUpBucket, selectBdeKpis } from "@/lib/leadgen/bde";

/** Assigned leads, follow-ups and credits for the signed-in BDE (sample identity for now). */
export function useBdeData() {
  const { state, dispatch } = useLeadGen();
  return useMemo(() => {
    const byId = new Map(state.leads.map((l) => [l.id, l]));
    const rows = (state.assignments ?? [])
      .filter((a) => a.bde === CURRENT_BDE)
      .map((a) => ({ ...a, lead: byId.get(a.leadId), bucket: followUpBucket(a.followUp) }))
      .filter((a) => a.lead);
    const log = (state.creditLog ?? []).filter((c) => c.bde === CURRENT_BDE);
    return { rows, log, kpis: selectBdeKpis(state, CURRENT_BDE), dispatch, bde: CURRENT_BDE };
  }, [state, dispatch]);
}
