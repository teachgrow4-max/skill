"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button, Input } from "@skilltego/ui";
import type { MentorAvailabilitySlot } from "@skilltego/types";
import { addAvailabilitySlotAction, deleteAvailabilitySlotAction } from "../actions";

export function AvailabilityManager({ initialSlots }: { initialSlots: MentorAvailabilitySlot[] }) {
  const [slots, setSlots] = React.useState(initialSlots);
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!start || !end) return;

    const result = await addAvailabilitySlotAction({ startTime: start, endTime: end });
    if (!result.success) {
      setError(result.error ?? "Could not add slot.");
      return;
    }

    setSlots((prev) => [...prev, { id: crypto.randomUUID(), mentorId: "", startTime: start, endTime: end, isBooked: false }]);
    setStart("");
    setEnd("");
  }

  async function handleRemove(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    await deleteAvailabilitySlotAction(id);
  }

  return (
    <div className="grid gap-3">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Start</label>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">End</label>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </div>
        <Button type="submit" size="sm">
          Add slot
        </Button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="grid gap-2">
        {slots.length === 0 && <p className="text-sm text-muted-foreground">No availability added yet.</p>}
        {slots.map((slot) => (
          <div key={slot.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>
              {new Date(slot.startTime).toLocaleString()} – {new Date(slot.endTime).toLocaleTimeString()}
            </span>
            <button type="button" onClick={() => handleRemove(slot.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
