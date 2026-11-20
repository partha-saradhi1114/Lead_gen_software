import { TODAY, isoDaysBefore } from "./data";

/** Sample signed-in BDE until real roles arrive with the backend. */
export const CURRENT_BDE = "Ravi Kumar";
export const BDE_STAGES = [
  "New",
  "Contacted",
  "Connected",
  "Interested",
  "Not Interested",
  "Converted",
];
/** Revealing a lead's phone and email costs one credit. */
export const UNLOCK_COST = 1;

const RANK = {
  New: 0,
  Contacted: 1,
  Connected: 2,
  Interested: 3,
  Converted: 4,
  "Not Interested": 2,
};
const isConnected = (s) => RANK[s] >= 2;
const isInterested = (s) => s === "Interested" || s === "Converted";

/** Deterministic assignments: approved leads handed to each BDE. */
export function buildSeedAssignments(leads, bdes) {
  const approved = leads.filter((l) => l.status === "approved");
  const out = [];
  const pattern = [
    "New",
    "New",
    "Contacted",
    "Connected",
    "Interested",
    "Not Interested",
    "Contacted",
    "Converted",
    "New",
    "Connected",
  ];
  bdes.forEach((b, bi) => {
    const mine = approved.slice(bi * 48, bi * 48 + 48);
    mine.forEach((l, i) => {
      const stage = pattern[i % pattern.length];
      const assignedOn = isoDaysBefore(TODAY, (i % 14) + 1);
      const due =
        i % 3 === 0 && stage !== "Not Interested" && stage !== "Converted" && stage !== "New"
          ? {
              on: isoDaysBefore(TODAY, (i % 7) - 3),
              note: "Call back to discuss requirement",
              done: false,
            }
          : null;
      out.push({
        leadId: l.id,
        bde: b.name,
        assignedOn,
        stage,
        unlocked: stage !== "New",
        followUp: due,
        activity: [
          { on: assignedOn, text: "Lead assigned by Master Admin" },
          ...(stage !== "New" ? [{ on: assignedOn, text: `Marked ${stage}` }] : []),
        ],
      });
    });
  });
  return out;
}

const touch = (state, leadId, bde, fn) => ({
  ...state,
  assignments: (state.assignments ?? []).map((a) =>
    a.leadId === leadId && a.bde === bde ? fn(a) : a,
  ),
});

export function bdeReducer(state, action) {
  const list = state.assignments ?? [];
  const a = list.find((x) => x.leadId === action.leadId && x.bde === action.bde);
  switch (action.type) {
    case "bdeUnlock": {
      if (!a || a.unlocked) return state;
      const row = state.bdes.find((b) => b.name === action.bde);
      if (!row || row.allocated - row.used < UNLOCK_COST) return state;
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        unlocked: true,
        activity: [...x.activity, { on: TODAY, text: `Contact unlocked (${UNLOCK_COST} credit)` }],
      }));
      return {
        ...s,
        bdes: state.bdes.map((b) =>
          b.name === action.bde ? { ...b, used: b.used + UNLOCK_COST } : b,
        ),
        credits: { ...state.credits, used: state.credits.used + UNLOCK_COST },
        creditLog: [
          { on: TODAY, bde: action.bde, kind: "Used", amount: UNLOCK_COST, leadId: a.leadId },
          ...(state.creditLog ?? []),
        ],
      };
    }
    case "bdeUpdate": {
      if (!a || !a.unlocked || !BDE_STAGES.includes(action.stage)) return state;
      const followUp = action.followUpOn
        ? { on: action.followUpOn, note: action.note?.trim() || "Follow up", done: false }
        : a.followUp;
      const newlyConnected = !isConnected(a.stage) && isConnected(action.stage) ? 1 : 0;
      const newlyInterested = !isInterested(a.stage) && isInterested(action.stage) ? 1 : 0;
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        stage: action.stage,
        followUp,
        activity: [
          ...x.activity,
          ...(action.stage !== x.stage ? [{ on: TODAY, text: `Marked ${action.stage}` }] : []),
          ...(action.note?.trim() ? [{ on: TODAY, text: action.note.trim() }] : []),
          ...(action.followUpOn
            ? [{ on: TODAY, text: `Follow-up set for ${action.followUpOn}` }]
            : []),
        ],
      }));
      return {
        ...s,
        bdes: state.bdes.map((b) =>
          b.name === action.bde
            ? {
                ...b,
                connected: b.connected + newlyConnected,
                interested: b.interested + newlyInterested,
              }
            : b,
        ),
      };
    }
    case "bdeCompleteFollowUp": {
      if (!a?.followUp || a.followUp.done) return state;
      return touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        followUp: { ...x.followUp, done: true, doneOn: TODAY },
        activity: [
          ...x.activity,
          {
            on: TODAY,
            text: `Follow-up completed${action.note?.trim() ? `: ${action.note.trim()}` : ""}`,
          },
        ],
      }));
    }
    case "bdeRequestCredits": {
      if (!Number.isInteger(action.amount) || action.amount <= 0 || !action.reason?.trim())
        return state;
      return {
        ...state,
        creditLog: [
          {
            on: TODAY,
            bde: action.bde,
            kind: "Requested",
            amount: action.amount,
            note: action.reason.trim(),
          },
          ...(state.creditLog ?? []),
        ],
      };
    }
    default:
      return state;
  }
}

export function followUpBucket(f) {
  if (!f) return null;
  if (f.done) return "done";
  if (f.on < TODAY) return "overdue";
  if (f.on === TODAY) return "today";
  return "upcoming";
}

export function selectBdeKpis(state, bde) {
  const mine = (state.assignments ?? []).filter((a) => a.bde === bde);
  const row = state.bdes.find((b) => b.name === bde) ?? { allocated: 0, used: 0 };
  const count = (fn) => mine.filter(fn).length;
  return {
    assigned: mine.length,
    fresh: count((a) => a.stage === "New"),
    unlocked: count((a) => a.unlocked),
    connected: count((a) => isConnected(a.stage)),
    interested: count((a) => isInterested(a.stage)),
    converted: count((a) => a.stage === "Converted"),
    overdue: count((a) => followUpBucket(a.followUp) === "overdue"),
    today: count((a) => followUpBucket(a.followUp) === "today"),
    upcoming: count((a) => followUpBucket(a.followUp) === "upcoming"),
    allocated: row.allocated,
    used: row.used,
    available: row.allocated - row.used,
  };
}
