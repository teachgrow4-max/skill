"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@skilltego/ui";
import type { MentorAvailabilitySlot } from "@skilltego/types";
import { bookSessionAction } from "../actions";

export function BookingWidget({ mentorId, slots, isLoggedIn }: { mentorId: string; slots: MentorAvailabilitySlot[]; isLoggedIn: boolean }) {
  const router = useRouter();
  const [bookingId, setBookingId] = React.useState<string | null>(null);
  const [bookedIds, setBookedIds] = React.useState<Set<string>>(new Set());

  async function handleBook(slot: MentorAvailabilitySlot) {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setBookingId(slot.id);
    const result = await bookSessionAction(mentorId, slot.id, slot.startTime);
    setBookingId(null);
    if (result.success) {
      setBookedIds((prev) => new Set(prev).add(slot.id));
    }
  }

  const available = slots.filter((s) => !bookedIds.has(s.id));

  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">No open slots right now.</p>;
  }

  return (
    <div className="grid gap-2">
      {available.map((slot) => (
        <div key={slot.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
          <span>
            {new Date(slot.startTime).toLocaleDateString()} · {new Date(slot.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Button size="sm" disabled={bookingId === slot.id} onClick={() => handleBook(slot)}>
            {bookingId === slot.id ? "Booking…" : "Book"}
          </Button>
        </div>
      ))}
    </div>
  );
}
