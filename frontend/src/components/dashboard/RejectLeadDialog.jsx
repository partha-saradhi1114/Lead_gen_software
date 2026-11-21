import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REJECTION_REASONS } from "@/lib/leadgen/data";
import { cn } from "@/lib/utils";

export function RejectLeadDialog({
  open,
  onOpenChange,
  count,
  companyName,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
      setError(false);
    }
  }, [open]);

  const submit = () => {
    const final =
      reason === "Other"
        ? notes.trim()
        : [reason, notes.trim()].filter(Boolean).join(" — ");
    if (!reason || (reason === "Other" && !notes.trim())) {
      setError(true);
      return;
    }
    onConfirm(final);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {count > 1 ? `Reject ${count} leads` : "Reject lead"}
          </DialogTitle>
          <DialogDescription>
            {companyName ? (
              <>
                Tell the researcher why <b>{companyName}</b> was rejected.
              </>
            ) : (
              "Tell the researchers why these leads were rejected."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Rejection reason</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {REJECTION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setError(false);
                  }}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    reason === r
                      ? "border-destructive bg-tint-red text-tint-red-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reject-notes">
              Notes {reason === "Other" ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="reject-notes"
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError(false);
              }}
              placeholder="Add context for the researcher…"
            />
          </div>
          {error && (
            <p className="text-xs font-medium text-destructive">
              Please choose a reason
              {reason === "Other" ? " and add a note" : ""}.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit}>
            Reject {count > 1 ? `${count} leads` : "lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
