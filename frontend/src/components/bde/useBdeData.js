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
      (storedUser.role === "bde" ||
        storedUser.role === "BDE" ||
        storedUser.role === "Business Development Executive") &&
      storedUser.name
        ? storedUser.name
        : CURRENT_BDE;
    const category =
      storedUser.category || BDE_CATEGORIES[bde] || "Students / Education";

    const byId = new Map();
    state.leads.forEach((l) => {
      byId.set(l.id, l);
      byId.set(String(l.id), l);
    });
    const localUnlockedSet = (() => {
      try {
        return new Set(
          JSON.parse(localStorage.getItem("leadgen_unlocked_leads") || "[]"),
        );
      } catch {
        return new Set();
      }
    })();

    const isLeadUnlocked = (aRec, leadRec) => {
      const id1 = aRec?.leadId ? String(aRec.leadId) : "";
      const id2 = leadRec?.id ? String(leadRec.id) : "";
      if (
        (id1 && localUnlockedSet.has(id1)) ||
        (id2 && localUnlockedSet.has(id2))
      )
        return true;
      if (aRec?.unlocked || leadRec?.unlocked) return true;
      const bdeName = (bde || "").toLowerCase();
      const userId = String(
        storedUser.id || storedUser._id || "",
      ).toLowerCase();
      const checkList = (arr) =>
        Array.isArray(arr) &&
        arr.some((u) => {
          if (!u) return false;
          const str = String(
            typeof u === "object" ? u.name || u._id || "" : u,
          ).toLowerCase();
          return str === bdeName || (userId && str === userId);
        });
      return checkList(leadRec?.unlockedBy) || checkList(aRec?.unlockedBy);
    };

    const assignmentsList = state.assignments ?? [];

    // Also include any leads that were allocated directly to this BDE in state.leads if not already in assignments
    const assignedLeadIds = new Set(
      assignmentsList
        .filter((a) => a.bde?.toLowerCase() === bde.toLowerCase())
        .map((a) => String(a.leadId)),
    );
    const extraAssignments = [];
    for (const lead of state.leads) {
      const leadAssigned =
        (lead.assignedName &&
          lead.assignedName.toLowerCase() === bde.toLowerCase()) ||
        (lead.assignedTo &&
          String(lead.assignedTo).toLowerCase() === bde.toLowerCase());
      if (leadAssigned && !assignedLeadIds.has(String(lead.id))) {
        extraAssignments.push({
          leadId: lead.id,
          bde,
          assignedOn: lead.assignedOn || new Date().toISOString().slice(0, 10),
          stage: lead.stage || "New",
          unlocked: isLeadUnlocked(null, lead),
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
      ...assignmentsList.filter(
        (a) => a.bde?.toLowerCase() === bde.toLowerCase(),
      ),
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
        const unlocked = isLeadUnlocked(a, rawLead);
        return {
          ...a,
          unlocked,
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
