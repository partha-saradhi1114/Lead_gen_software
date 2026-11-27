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
    const bdeName = (bde || "").toLowerCase();
    const localUnlockedSet = (() => {
      try {
        const bdeSpecific = JSON.parse(
          localStorage.getItem(`leadgen_unlocked_leads_${bdeName}`) || "null",
        );
        if (Array.isArray(bdeSpecific)) return new Set(bdeSpecific);
        return new Set();
      } catch {
        return new Set();
      }
    })();
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

    const isUnlockedByMe = (aRec, leadRec) => {
      const id1 = aRec?.leadId ? String(aRec.leadId) : "";
      const id2 = leadRec?.id ? String(leadRec.id) : "";
      if (
        (id1 && localUnlockedSet.has(id1)) ||
        (id2 && localUnlockedSet.has(id2))
      ) {
        return true;
      }
      return checkList(leadRec?.unlockedBy) || checkList(aRec?.unlockedBy);
    };

    const isLeadUnlocked = (aRec, leadRec) => {
      if (isUnlockedByMe(aRec, leadRec)) return true;
      if (aRec?.unlocked || leadRec?.unlocked) return true;
      if (Array.isArray(leadRec?.unlockedBy) && leadRec.unlockedBy.length > 0) return true;
      if (Array.isArray(aRec?.unlockedBy) && aRec.unlockedBy.length > 0) return true;
      return false;
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
          lead.assignedName.toLowerCase() === bdeName) ||
        (lead.assignedTo &&
          String(lead.assignedTo).toLowerCase() === bdeName) ||
        (Array.isArray(lead.assignedBdes) &&
          lead.assignedBdes.some((b) => String(b).toLowerCase() === bdeName)) ||
        checkList(lead.unlockedBy);

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
        const unlockedByMe = isUnlockedByMe(a, rawLead);
        const isViewed = unlocked && (!unlockedByMe || bdeName === "billa");
        return {
          ...a,
          unlocked,
          unlockedByMe,
          isViewed,
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
