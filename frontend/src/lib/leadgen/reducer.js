import { makeLead, TODAY } from "./data";
import { bdeReducer } from "./bde";

export function leadGenReducer(state, action) {
  if (action.type === "hydrate") {
    const existingSettings = state?.settings || {};
    const incomingSettings = action.state?.settings;
    let mergedSettings = existingSettings;

    if (incomingSettings && typeof incomingSettings === "object") {
      mergedSettings = {
        ...incomingSettings,
        ...existingSettings,
        general: {
          ...(incomingSettings.general || {}),
          ...(existingSettings.general || {}),
          workspaceName:
            existingSettings.general?.workspaceName &&
            existingSettings.general?.workspaceName !== "Lead Generation Software" &&
            incomingSettings.general?.workspaceName === "Lead Generation Software"
              ? existingSettings.general.workspaceName
              : incomingSettings.general?.workspaceName ||
                existingSettings.general?.workspaceName ||
                "Lead Generation Software",
        },
        credits: {
          ...(incomingSettings.credits || {}),
          ...(existingSettings.credits || {}),
        },
        rules: {
          ...(incomingSettings.rules || {}),
          ...(existingSettings.rules || {}),
        },
        notifications: {
          ...(incomingSettings.notifications || {}),
          ...(existingSettings.notifications || {}),
        },
      };
    }

    return {
      ...state,
      ...action.state,
      settings: mergedSettings,
    };
  }
  if (action.type.startsWith("bde")) return bdeReducer(state, action);
  switch (action.type) {
    case "approve": {
      const ids = new Set(
        action.ids.map((id) =>
          typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id,
        ),
      );
      return {
        ...state,
        leads: state.leads.map((l) =>
          (ids.has(l.id) || ids.has(String(l.id))) && l.status === "pending"
            ? { ...l, status: "approved", reviewedOn: TODAY }
            : l,
        ),
      };
    }
    case "reject": {
      const reason = action.reason?.trim();
      if (!reason) return state; // a rejection always needs a reason
      const ids = new Set(
        action.ids.map((id) =>
          typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id,
        ),
      );
      return {
        ...state,
        leads: state.leads.map((l) =>
          (ids.has(l.id) || ids.has(String(l.id))) && l.status === "pending"
            ? {
                ...l,
                status: "rejected",
                rejectionReason: reason,
                reviewedOn: TODAY,
              }
            : l,
        ),
      };
    }
    case "upload": {
      if (!Number.isInteger(action.count) || action.count <= 0) return state;
      let seed = state.nextId * 7919;
      const r = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      const fresh = [];
      for (let i = 0; i < action.count; i++) {
        const lead = makeLead(
          r,
          state.nextId + i,
          "pending",
          TODAY,
          action.researcher,
        );
        fresh.push({
          ...lead,
          source: action.source,
          category: action.category || lead.category,
        });
      }
      return {
        ...state,
        leads: [...fresh, ...state.leads],
        nextId: state.nextId + action.count,
      };
    }
    case "allocate": {
      if (!Number.isInteger(action.amount) || action.amount <= 0) return state;
      if (!state.bdes.some((b) => b.name === action.bde)) return state;
      return {
        ...state,
        bdes: state.bdes.map((b) =>
          b.name === action.bde
            ? { ...b, allocated: b.allocated + action.amount }
            : b,
        ),
        credits: {
          ...state.credits,
          allocated: state.credits.allocated + action.amount,
        },
        creditLog: [
          {
            on: TODAY,
            bde: action.bde,
            kind: "Allocated",
            amount: action.amount,
            note: "Credits allocated by Master Admin",
          },
          ...(state.creditLog ?? []),
        ],
      };
    }
    case "allocateLeads": {
      const ids = new Set(
        action.leadIds.map((id) =>
          typeof id === "string" && !isNaN(Number(id)) ? Number(id) : id,
        ),
      );
      const todayIso = new Date().toISOString().slice(0, 10);
      const existingAssignments = state.assignments || [];
      const newAssignments = [...existingAssignments];

      for (const rawId of action.leadIds) {
        const id =
          typeof rawId === "string" && !isNaN(Number(rawId))
            ? Number(rawId)
            : rawId;
        const existingIdx = newAssignments.findIndex(
          (a) => a.leadId === id || a.leadId === String(id),
        );
        if (existingIdx >= 0) {
          newAssignments[existingIdx] = {
            ...newAssignments[existingIdx],
            bde: action.bde,
            assignedOn: todayIso,
          };
        } else {
          newAssignments.push({
            leadId: id,
            bde: action.bde,
            assignedOn: todayIso,
            stage: "New",
            unlocked: false,
            followUp: null,
            activity: [
              {
                on: todayIso,
                text: `Lead assigned by Master Admin to ${action.bde}`,
              },
            ],
          });
        }
      }

      return {
        ...state,
        leads: (state.leads || []).map((l) =>
          ids.has(l.id) || ids.has(String(l.id))
            ? {
                ...l,
                assignedName: action.bde,
                assignedTo: action.bde,
                assignedOn: todayIso,
              }
            : l,
        ),
        assignments: newAssignments,
      };
    }
    case "addMember": {
      const m = action.member;
      if (!m.name.trim() || !m.email.trim()) return state;
      const cleanMember = {
        name: m.name.trim(),
        email: m.email.trim(),
        phone: m.phone?.trim() || "",
        role: m.role || "BDE",
      };
      const existingIdx = state.team.findIndex(
        (tm) => tm.email?.toLowerCase() === cleanMember.email.toLowerCase(),
      );
      const newTeam =
        existingIdx >= 0
          ? state.team.map((tm, idx) =>
              idx === existingIdx ? cleanMember : tm,
            )
          : [...state.team, cleanMember];

      const bdeExists = state.bdes.some((b) => b.name === cleanMember.name);
      const bdes =
        cleanMember.role === "BDE" && !bdeExists
          ? [
              ...state.bdes,
              {
                name: cleanMember.name,
                allocated: 500,
                used: 0,
                connected: 0,
                interested: 0,
              },
            ]
          : state.bdes;
      return {
        ...state,
        team: newTeam,
        bdes,
        credits:
          cleanMember.role === "BDE" && !bdeExists
            ? { ...state.credits, allocated: state.credits.allocated + 500 }
            : state.credits,
      };
    }
    case "setDateRange":
      return { ...state, dateRange: action.range };
    case "submitBatch": {
      if (
        action.rows.length === 0 ||
        state.batches.some((b) => b.id === action.batch.id)
      )
        return state;
      const fresh = action.rows.map((r, i) => ({
        ...r,
        id: state.nextId + i,
        status: "pending",
        uploadedBy: action.batch.researcher,
        uploadedOn: action.batch.uploadedOn,
        batchId: action.batch.id,
      }));
      return {
        ...state,
        leads: [...fresh, ...state.leads],
        batches: [{ ...action.batch, draft: false }, ...state.batches],
        nextId: state.nextId + fresh.length,
      };
    }
    case "resubmit": {
      // Only rejected leads can be corrected; the earlier rejection is kept in history.
      return {
        ...state,
        leads: state.leads.map((l) =>
          l.id === action.id && l.status === "rejected"
            ? {
                ...l,
                ...action.changes,
                status: "pending",
                history: [
                  ...(l.history ?? []),
                  {
                    reason: l.rejectionReason ?? "Rejected",
                    rejectedOn: l.reviewedOn ?? TODAY,
                  },
                ],
                rejectionReason: undefined,
                reviewedOn: undefined,
                resubmittedOn: TODAY,
              }
            : l,
        ),
      };
    }
    case "updateSettings": {
      const section = action.section;
      const currentSettings = state.settings || {};
      const updatedSettings = {
        ...currentSettings,
        [section]: {
          ...(currentSettings[section] || {}),
          ...action.values,
        },
      };
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(
            "leadgen_settings",
            JSON.stringify(updatedSettings),
          );
        }
      } catch (_e) {
        // ignore localStorage errors in non-browser or quota restricted envs
      }
      return {
        ...state,
        settings: updatedSettings,
      };
    }
    default:
      return state;
  }
}

export function selectKpis(state) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  const leads = state?.leads || [];
  for (const l of leads) {
    if (l.status === "pending") pending++;
    else if (l.status === "approved") approved++;
    else rejected++;
  }
  const credits = state?.credits || {};
  const allocated =
    typeof credits.allocated === "number" ? credits.allocated : 0;
  const used = typeof credits.used === "number" ? credits.used : 0;
  const reviewed = approved + rejected;
  const approvalRate = reviewed === 0 ? 0 : (approved / reviewed) * 100;
  const duplicates = (state?.batches || []).reduce(
    (a, b) => a + (b.duplicates || 0),
    0,
  );
  return {
    total: leads.length,
    pending,
    approved,
    rejected,
    duplicates,
    creditsAllocated: allocated,
    creditsUsed: used,
    creditsAvailable: Math.max(0, allocated - used),
    utilization: allocated === 0 ? 0 : Math.round((used / allocated) * 100),
    approvalRate,
  };
}

export function batchCounts(leads, batchId) {
  let pending = 0,
    approved = 0,
    rejected = 0;
  const list = leads || [];
  for (const l of list) {
    if (l.batchId !== batchId) continue;
    if (l.status === "pending") pending++;
    else if (l.status === "approved") approved++;
    else rejected++;
  }
  return { pending, approved, rejected };
}

export function batchStatus(batch, c) {
  if (batch?.draft) return "Draft";
  const countObj = c || { pending: 0, approved: 0, rejected: 0 };
  const total = countObj.pending + countObj.approved + countObj.rejected;
  if (total === 0 || countObj.pending === total)
    return batch?.uploadedOn === TODAY ? "Uploaded" : "Under Review";
  if (countObj.approved === total) return "Approved";
  if (countObj.rejected === total) return "Rejected";
  return "Partially Approved";
}

export function selectRaKpis(state, researcher) {
  let total = 0,
    pending = 0,
    approved = 0,
    rejected = 0;
  const leads = state?.leads || [];
  for (const l of leads) {
    if (l.uploadedBy !== researcher && l.uploaderName !== researcher) continue;
    total++;
    if (l.status === "pending") pending++;
    else if (l.status === "approved") approved++;
    else rejected++;
  }
  const duplicates = (state?.batches || [])
    .filter(
      (b) =>
        (b.researcher === researcher || b.uploaderName === researcher) &&
        !b.draft,
    )
    .reduce((a, b) => a + (b.duplicates || 0), 0);
  return { total, pending, approved, rejected, duplicates };
}
