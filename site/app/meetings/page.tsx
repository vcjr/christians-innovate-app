import { CalendarDays, Clock } from "lucide-react";
import type { Metadata } from "next";

import { Card, PageHero } from "@/components/ui";
import { upcomingMeetings, type Meeting } from "@/lib/data";
import { APP_URL, longDay, nyDate, timeOfDay } from "@/lib/site";

export const metadata: Metadata = { title: "Meetings", description: "We gather every Thursday. See what’s coming up." };

export const revalidate = 300;

/** The next [count] Thursdays (YYYY-MM-DD, New York) from today. */
function nextThursdays(count: number): string[] {
  const [y, m, d] = nyDate().split("-").map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));
  const offset = (4 - today.getUTCDay() + 7) % 7;
  return Array.from({ length: count }, (_, i) => {
    const t = new Date(today);
    t.setUTCDate(today.getUTCDate() + offset + i * 7);
    return t.toISOString().slice(0, 10);
  });
}

/** 1st and 3rd Thursdays are the Bible Year Recap; the rest are Community Convening. */
function usualTitle(date: string): string {
  const nth = Math.ceil(Number(date.slice(8, 10)) / 7);
  return nth === 1 || nth === 3 ? "Bible Year Recap" : "Community Convening";
}

type Row = { date: string; title: string; description: string | null; time: string | null; scheduled: boolean };

/** The usual Thursday rhythm, with anything an admin scheduled in the app taking its date's place. */
function schedule(meetings: Meeting[]): Row[] {
  const byDate = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const key = nyDate(m.startsAt);
    byDate.set(key, [...(byDate.get(key) ?? []), m]);
  }
  const rows: Row[] = [];
  for (const date of nextThursdays(8)) {
    const scheduled = byDate.get(date);
    byDate.delete(date);
    if (scheduled) {
      rows.push(...scheduled.map((m) => ({ date, title: m.title, description: m.description, time: timeOfDay(m.startsAt), scheduled: true })));
    } else {
      rows.push({ date, title: usualTitle(date), description: null, time: null, scheduled: false });
    }
  }
  // Meetings on other days (or past the eight weeks shown) still get listed.
  for (const [date, ms] of byDate) {
    rows.push(...ms.map((m) => ({ date, title: m.title, description: m.description, time: timeOfDay(m.startsAt), scheduled: true })));
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export default async function Meetings() {
  const rows = schedule(await upcomingMeetings(20));
  return (
    <>
      <PageHero
        title="Meeting Schedule"
        lead={
          <>
            We gather every Thursday. Join us!
            <span className="mt-3 block text-base">
              <strong className="text-ink">1st &amp; 3rd Thursdays:</strong> Bible Year Recap ·{" "}
              <strong className="text-ink">Other Thursdays:</strong> Community Convening
            </span>
          </>
        }
      />
      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-20 sm:px-6">
        {rows.map((r, i) => (
          <Card key={`${r.date}-${i}`} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <CalendarDays className="size-4 text-brand" />
                {longDay(new Date(`${r.date}T12:00:00Z`))}
                {r.time && (
                  <>
                    <Clock className="ml-2 size-4 text-brand" />
                    {r.time}
                  </>
                )}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold">{r.title}</h2>
              {r.description && <p className="mt-1 text-sm text-muted">{r.description}</p>}
            </div>
            {r.scheduled && (
              <a
                href={APP_URL}
                className="shrink-0 rounded-full bg-brand px-5 py-2 text-center text-sm font-medium text-white shadow-soft hover:bg-brand-deep"
              >
                Join in the app
              </a>
            )}
          </Card>
        ))}
        <p className="pt-2 text-center text-sm text-muted">
          Members get the meeting link and reminders in the{" "}
          <a href={APP_URL} className="text-brand hover:underline">
            Christians Innovate app
          </a>
          .
        </p>
      </div>
    </>
  );
}
