import { TODAY, currentDate, isoDaysBefore } from "./data";

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
        i % 3 === 0 &&
        stage !== "Not Interested" &&
        stage !== "Converted" &&
        stage !== "New"
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
          ...(stage !== "New"
            ? [{ on: assignedOn, text: `Marked ${stage}` }]
            : []),
        ],
      });
    });
  });
  return out;
}

const touch = (state, leadId, bde, fn) => {
  const list = state.assignments ?? [];
  const exists = list.some(
    (a) => String(a.leadId) === String(leadId) && a.bde === bde,
  );
  const assignments = exists
    ? list.map((a) =>
        String(a.leadId) === String(leadId) && a.bde === bde ? fn(a) : a,
      )
    : [
        ...list,
        fn({
          leadId,
          bde,
          assignedOn: TODAY,
          stage: "New",
          unlocked: true,
          followUp: null,
          activity: [],
        }),
      ];
  return {
    ...state,
    assignments,
  };
};

export function bdeReducer(state, action) {
  const list = state.assignments ?? [];
  let a = list.find(
    (x) => String(x.leadId) === String(action.leadId) && x.bde === action.bde,
  );

  if (!a) {
    const lead = (state.leads || []).find(
      (l) => String(l.id) === String(action.leadId),
    );
    if (lead && (lead.assignedName === action.bde || lead.assignedTo === action.bde)) {
      const isUnlocked = Array.isArray(lead.unlockedBy)
        ? lead.unlockedBy.includes(action.bde)
        : Boolean(lead.unlocked);
      a = {
        leadId: lead.id,
        bde: action.bde,
        assignedOn: lead.assignedOn || TODAY,
        stage: lead.stage || "New",
        unlocked: isUnlocked,
        followUp: lead.followUpDate
          ? {
              on: lead.followUpDate,
              note: lead.notes || "Follow up",
              done: false,
            }
          : null,
        activity: [
          {
            on: TODAY,
            text: `Lead assigned by Master Admin to ${action.bde}`,
          },
        ],
      };
    }
  }

  switch (action.type) {
    case "bdeUnlock": {
      if (!a || a.unlocked) return state;
      let row = state.bdes.find(
        (b) => b.name?.toLowerCase() === action.bde?.toLowerCase(),
      );
      if (!row) {
        row = {
          name: action.bde,
          allocated: 500,
          used: 0,
          connected: 0,
          interested: 0,
        };
      }
      if (row.allocated - row.used < UNLOCK_COST) return state;
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        unlocked: true,
        activity: [
          ...x.activity,
          { on: TODAY, text: `Contact unlocked (${UNLOCK_COST} credit)` },
        ],
      }));
      const bdeExists = state.bdes.some(
        (b) => b.name?.toLowerCase() === action.bde?.toLowerCase(),
      );
      const updatedBdes = bdeExists
        ? state.bdes.map((b) =>
            b.name?.toLowerCase() === action.bde?.toLowerCase()
              ? { ...b, used: b.used + UNLOCK_COST }
              : b,
          )
        : [...state.bdes, { ...row, used: row.used + UNLOCK_COST }];

      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === String(action.leadId)
            ? {
                ...l,
                unlocked: true,
                unlockedBy: Array.isArray(l.unlockedBy)
                  ? [...new Set([...l.unlockedBy, action.bde])]
                  : [action.bde],
              }
            : l,
        ),
        bdes: updatedBdes,
        credits: { ...state.credits, used: state.credits.used + UNLOCK_COST },
        creditLog: [
          {
            on: TODAY,
            bde: action.bde,
            kind: "Used",
            amount: UNLOCK_COST,
            leadId: a.leadId,
          },
          ...(state.creditLog ?? []),
        ],
      };
    }
    case "bdeUpdate": {
      if (!a || !a.unlocked || !BDE_STAGES.includes(action.stage)) return state;
      const followUp = action.followUpOn
        ? {
            on: action.followUpOn,
            note: action.note?.trim() || "Follow up",
            done: false,
          }
        : a.followUp;
      const newlyConnected =
        !isConnected(a.stage) && isConnected(action.stage) ? 1 : 0;
      const newlyInterested =
        !isInterested(a.stage) && isInterested(action.stage) ? 1 : 0;
      const s = touch(state, a.leadId, a.bde, (x) => ({
        ...x,
        stage: action.stage,
        followUp,
        activity: [
          ...x.activity,
          ...(action.stage !== x.stage
            ? [{ on: TODAY, text: `Marked ${action.stage}` }]
            : []),
          ...(action.note?.trim()
            ? [{ on: TODAY, text: action.note.trim() }]
            : []),
          ...(action.followUpOn
            ? [{ on: TODAY, text: `Follow-up set for ${action.followUpOn}` }]
            : []),
        ],
      }));
      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === String(action.leadId)
            ? {
                ...l,
                stage: action.stage ?? l.stage,
                notes: action.note !== undefined ? action.note : l.notes,
                followUpDate:
                  action.followUpOn !== undefined
                    ? action.followUpOn
                    : l.followUpDate,
              }
            : l,
        ),
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
      const s = touch(state, a.leadId, a.bde, (x) => ({
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
      return {
        ...s,
        leads: (state.leads || []).map((l) =>
          String(l.id) === String(action.leadId)
            ? {
                ...l,
                followUpDone: true,
                followUpDate: undefined,
              }
            : l,
        ),
      };
    }
    case "bdeRequestCredits": {
      if (
        !Number.isInteger(action.amount) ||
        action.amount <= 0 ||
        !action.reason?.trim()
      )
        return state;
      return {
        ...state,
        creditLog: [
          {
            on: currentDate(),
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
  const bdeLower = (bde || "").toLowerCase();
  const mine = (state?.assignments ?? []).filter(
    (a) => a.bde?.toLowerCase() === bdeLower,
  );
  const row = (state?.bdes ?? []).find(
    (b) => b.name?.toLowerCase() === bdeLower,
  ) ?? {
    allocated: 500,
    used: 0,
  };

  let localUnlockedCount = 0;
  try {
    if (typeof window !== "undefined") {
      const list = JSON.parse(
        localStorage.getItem("leadgen_unlocked_leads") || "[]",
      );
      if (Array.isArray(list)) localUnlockedCount = list.length;
    }
  } catch {}

  const usedCredits = Math.max(row.used || 0, localUnlockedCount);
  const allocatedCredits = row.allocated || 500;

  const count = (fn) => mine.filter(fn).length;
  return {
    assigned: mine.length,
    fresh: count((a) => a.stage === "New"),
    unlocked: Math.max(count((a) => a.unlocked), localUnlockedCount),
    connected: count((a) => isConnected(a.stage)),
    interested: count((a) => isInterested(a.stage)),
    converted: count((a) => a.stage === "Converted"),
    overdue: count((a) => followUpBucket(a.followUp) === "overdue"),
    today: count((a) => followUpBucket(a.followUp) === "today"),
    upcoming: count((a) => followUpBucket(a.followUp) === "upcoming"),
    allocated: allocatedCredits,
    used: usedCredits,
    available: Math.max(0, allocatedCredits - usedCredits),
  };
}
