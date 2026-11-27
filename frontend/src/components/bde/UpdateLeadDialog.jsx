import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BDE_STAGES } from "@/lib/leadgen/bde";
import { TODAY, formatDate } from "@/lib/leadgen/data";

export function UpdateLeadDialog({ row, onClose, dispatch, bde }) {
  const [stage, setStage] = useState("Contacted");
  const [note, setNote] = useState("");
  const [followUpOn, setFollowUpOn] = useState("");
  useEffect(() => {
    if (row) {
      setStage(row.stage === "New" ? "Contacted" : row.stage);
      setNote(row.followUp?.note || row.lead?.notes || "");
      const existingDate = row.followUp?.on || row.lead?.followUpDate || "";
      const datePart =
        typeof existingDate === "string"
          ? existingDate.split("T")[0]
          : existingDate instanceof Date && !isNaN(existingDate.getTime())
            ? existingDate.toISOString().split("T")[0]
            : "";
      setFollowUpOn(datePart);
    }
  }, [row]);

  const save = () => {
    if (followUpOn && followUpOn < TODAY)
      return void toast.error("Follow-up date can't be in the past");
    dispatch({
      type: "bdeUpdate",
      bde,
      leadId: row.leadId,
      stage,
      note,
      followUpOn: followUpOn || undefined,
    });
    api
      .updateLead(row.leadId, {
        stage,
        notes: note,
        followUpDate: followUpOn || undefined,
      })
      .catch((err) =>
        console.warn("[API] updateLead sync failed:", err.message),
      );
    toast.success(`${row.lead.company} updated`);
    onClose();
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update lead</DialogTitle>
          <DialogDescription>
            {row?.lead.company} · {row?.lead.contact}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BDE_STAGES.filter((s) => s !== "New").map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bde-note">Call notes</Label>
            <Textarea
              id="bde-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you discuss?"
              rows={3}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="bde-fu">Schedule follow-up (optional)</Label>
            <Input
              id="bde-fu"
              type="date"
              min={TODAY}
              value={followUpOn}
              onChange={(e) => setFollowUpOn(e.target.value)}
            />
          </div>
          {row && (
            <div className="max-h-32 overflow-auto rounded-md bg-muted/60 p-2.5">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Activity
              </div>
              <ul className="space-y-1">
                {[...row.activity].reverse().map((a, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-muted-foreground">
                      {formatDate(a.on)} ·{" "}
                    </span>
                    {a.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
