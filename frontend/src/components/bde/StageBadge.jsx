import { cn } from "@/lib/utils";
import { normalizeStage } from "@/lib/leadgen/bde";

const TONE = {
  New: "bg-tint-blue text-tint-blue-foreground",
  "Connected – Interested": "bg-tint-amber text-tint-amber-foreground",
  Interested: "bg-tint-amber text-tint-amber-foreground",
  "Meeting Scheduled":
    "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  "Demo Required":
    "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  "Proposal / Quotation Sent":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  Negotiation:
    "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  "Decision Pending":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  "Approval Pending":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  "Budget Pending":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  "Requirement Pending":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  "Payment Pending":
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  Converted: "bg-tint-green text-tint-green-foreground",

  "Call Back Requested":
    "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  "Follow-up Required":
    "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
  "Asked to Contact via WhatsApp":
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Email Details Requested":
    "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",
  "Waiting for Response":
    "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
  "Awaiting Response":
    "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
  Processing:
    "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300",

  "No Answer":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  "Switched Off":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  "Not Reachable":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  Busy: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  "Call Disconnected":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  "Out of Coverage":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  "Contact Person Unavailable":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  "Temporarily Unavailable":
    "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300",

  "Connected – Not Interested": "bg-tint-red text-tint-red-foreground",
  "Not Interested": "bg-tint-red text-tint-red-foreground",
  Lost: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  Rejected: "bg-tint-red text-tint-red-foreground",
  "Contact Person Changed":
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
  "Do Not Contact":
    "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/50 dark:text-red-300",
  "Duplicate Lead":
    "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
  "No Current Requirement":
    "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
  "Already Using Competitor":
    "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  "Budget Issue":
    "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300",
  "Wrong Number":
    "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-300",
  "Number Does Not Exist":
    "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-300",
  "Invalid Lead":
    "bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/50 dark:text-red-300",

  Connected: "bg-tint-violet text-tint-violet-foreground",
  Contacted: "bg-tint-cyan text-tint-cyan-foreground",
};

export function StageBadge({ stage }) {
  const norm = normalizeStage(stage);
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        TONE[norm] || TONE[stage] || "bg-muted text-muted-foreground",
      )}
    >
      {norm || stage}
    </span>
  );
}

/** Hides most of a phone/email until the BDE spends a credit to unlock it. */
export const mask = (v) => (v ? v.slice(0, 4) + "•••••" + v.slice(-2) : "—");
