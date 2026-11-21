import { useMemo } from "react";
import { useLeadGen } from "@/lib/leadgen/store";
import { CURRENT_BDE, followUpBucket, selectBdeKpis } from "@/lib/leadgen/bde";
import { BDE_CATEGORIES } from "@/lib/leadgen/data";

/** Assigned leads, follow-ups and credits for the signed-in BDE. */
export function useBdeData() {
  const { state, dispatch } = useLeadGen();
  return useMemo(() => {
    const storedUser = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    const bde =
      storedUser.role === "bde" && storedUser.name
        ? storedUser.name
        : CURRENT_BDE;
    const category =
      storedUser.category || BDE_CATEGORIES[bde] || "Students / Education";

    const byId = new Map();
    state.leads.forEach((l) => {
      byId.set(l.id, l);
      byId.set(String(l.id), l);
    });
    const assignmentsList = state.assignments ?? [];

    // Also include any leads that were allocated directly to this BDE in state.leads if not already in assignments
    const assignedLeadIds = new Set(
      assignmentsList.filter((a) => a.bde === bde).map((a) => a.leadId),
    );
    const extraAssignments = [];
    for (const lead of state.leads) {
      if (
        (lead.assignedName === bde || lead.assignedTo === bde) &&
        !assignedLeadIds.has(lead.id)
      ) {
        extraAssignments.push({
          leadId: lead.id,
          bde,
          assignedOn: lead.assignedOn || new Date().toISOString().slice(0, 10),
          stage: lead.stage || "New",
          unlocked: Array.isArray(lead.unlockedBy)
            ? lead.unlockedBy.includes(bde)
            : false,
          followUp: lead.followUpDate
            ? {
                on: lead.followUpDate,
                note: lead.notes || "Follow-up",
                done: false,
              }
            : null,
          activity: [
            {
              on: new Date().toISOString().slice(0, 10),
              text: "Lead assigned by Master Admin",
            },
          ],
        });
      }
    }

    const allMyAssignments = [
      ...assignmentsList.filter((a) => a.bde === bde),
      ...extraAssignments,
    ];

    const rows = allMyAssignments
      .map((a) => {
        const rawLead = byId.get(a.leadId);
        if (!rawLead) return null;
        const lead = {
          ...rawLead,
          category: rawLead.category || category,
        };
        return {
          ...a,
          lead,
          bucket: followUpBucket(a.followUp),
        };
      })
      .filter(Boolean);

    const log = (state.creditLog ?? []).filter((c) => c.bde === bde);
    return {
      rows,
      log,
      kpis: selectBdeKpis(state, bde),
      dispatch,
      bde,
      category,
    };
  }, [state, dispatch]);
}
