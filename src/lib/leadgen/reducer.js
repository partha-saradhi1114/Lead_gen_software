import { makeLead, TODAY } from "./data";
import { bdeReducer } from "./bde";

export function leadGenReducer(state, action) {
  if (action.type === "hydrate") return { ...state, ...action.state };
  if (action.type.startsWith("bde")) return bdeReducer(state, action);
  switch (action.type) {
    case "approve": {
      const ids = new Set(action.ids);
      return {
        ...state,
        leads: state.leads.map((l) =>
          ids.has(l.id) && l.status === "pending"
            ? { ...l, status: "approved", reviewedOn: TODAY }
            : l,
        ),
      };
    }
    case "reject": {
      const reason = action.reason.trim();
      if (!reason) return state; // a rejection always needs a reason
      const ids = new Set(action.ids);
      return {
        ...state,
        leads: state.leads.map((l) =>
          ids.has(l.id) && l.status === "pending"
            ? { ...l, status: "rejected", rejectionReason: reason, reviewedOn: TODAY }
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
        const lead = makeLead(r, state.nextId + i, "pending", TODAY, action.researcher);
        fresh.push({ ...lead, source: action.source });
      }
      return { ...state, leads: [...fresh, ...state.leads], nextId: state.nextId + action.count };
    }
    case "allocate": {
      if (!Number.isInteger(action.amount) || action.amount <= 0) return state;
      if (!state.bdes.some((b) => b.name === action.bde)) return state;
      return {
        ...state,
        bdes: state.bdes.map((b) =>
          b.name === action.bde ? { ...b, allocated: b.allocated + action.amount } : b,
        ),
        credits: { ...state.credits, allocated: state.credits.allocated + action.amount },
      };
    }
    case "addMember": {
      const m = action.member;
      if (!m.name.trim() || !m.email.trim()) return state;
      const bdes =
        m.role === "BDE"
          ? [...state.bdes, { name: m.name, allocated: 0, used: 0, connected: 0, interested: 0 }]
          : state.bdes;
      return { ...state, team: [...state.team, m], bdes };
    }
    case "setDateRange":
      return { ...state, dateRange: action.range };
    case "submitBatch": {
      if (action.rows.length === 0 || state.batches.some((b) => b.id === action.batch.id))
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
                  { reason: l.rejectionReason ?? "Rejected", rejectedOn: l.reviewedOn ?? TODAY },
                ],
                rejectionReason: undefined,
                reviewedOn: undefined,
                resubmittedOn: TODAY,
              }
            : l,
        ),
      };
    }
  }
}

export function selectKpis(state) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  for (const l of state.leads) {
    if (l.status === "pending") pending++;
    else if (l.status === "approved") approved++;
    else rejected++;
  }
  const { allocated, used } = state.credits;
  return {
    total: state.leads.length,
    pending,
    approved,
    rejected,
    creditsAllocated: allocated,
    creditsUsed: used,
    creditsAvailable: allocated - used,
    utilization: allocated === 0 ? 0 : Math.round((used / allocated) * 100),
  };
}

export function batchCounts(leads, batchId) {
  let pending = 0,
    approved = 0,
    rejected = 0;
  for (const l of leads) {
    if (l.batchId !== batchId) continue;
    if (l.status === "pending") pending++;
    else if (l.status === "approved") approved++;
    else rejected++;
  }
  return { pending, approved, rejected };
}

export function batchStatus(batch, c) {
  if (batch.draft) return "Draft";
  const total = c.pending + c.approved + c.rejected;
  if (total === 0 || c.pending === total)
    return batch.uploadedOn === TODAY ? "Uploaded" : "Under Review";
  if (c.approved === total) return "Approved";
  if (c.rejected === total) return "Rejected";
  return "Partially Approved";
}

export function selectRaKpis(state, researcher) {
  let total = 0,
    pending = 0,
    approved = 0,
    rejected = 0;
  for (const l of state.leads) {
    if (l.uploadedBy !== researcher) continue;
    total++;
    if (l.status === "pending") pending++;
    else if (l.status === "approved") approved++;
    else rejected++;
  }
  const duplicates = state.batches
    .filter((b) => b.researcher === researcher && !b.draft)
    .reduce((a, b) => a + b.duplicates, 0);
  return { total, pending, approved, rejected, duplicates };
}
