import { BookOpen, CalendarDays, Users } from "lucide-react";
import Link from "next/link";

import type { Meeting } from "@/lib/data";
import { longDay } from "@/lib/site";

/** The strip under the header: the next meeting and today's reading. */
export function MeetingBar({ meeting, reading }: { meeting: Meeting | null; reading: string | null }) {
  if (!meeting && !reading) return null;
  return (
    <Link
      href="/meetings"
      className="block border-b border-line/60 bg-white/70 px-4 py-2.5 text-sm transition-colors hover:bg-white"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-1 text-muted">
        {meeting && (
          <>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-brand" />
              Next Meeting: <strong className="font-semibold text-ink">{longDay(meeting.startsAt)}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="size-4 text-gold" />
              <strong className="font-semibold text-ink">{meeting.title}</strong>
            </span>
          </>
        )}
        {reading && (
          <span className="inline-flex items-center gap-2">
            <BookOpen className="size-4 text-gold" />
            Reading: <strong className="font-semibold text-ink">{reading}</strong>
          </span>
        )}
      </div>
    </Link>
  );
}
