"use client";

import { CalendarDays, ExternalLink, Heart, MapPin, Star } from "lucide-react";
import { useActionState, useMemo, useState, useSyncExternalStore } from "react";

import { submitNytwEvent, toggleNytwLike, type FormState } from "@/app/actions";
import type { NytwEvent } from "@/lib/data";

import { Button, Card, Field, FormStatus, Honeypot, Input, Select, Textarea } from "./ui";

const ALL = "all";
const LIKED_KEY = "nytw-liked";
const ANON_KEY = "nytw-anon-id";

/** A random id kept in this browser, so likes can be undone without an account. */
function anonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// The events this browser liked, kept in localStorage and read as an external store so the
// server render (nothing liked) and the browser agree until it hydrates.
const likedListeners = new Set<() => void>();

function subscribeLiked(listener: () => void) {
  likedListeners.add(listener);
  return () => likedListeners.delete(listener);
}

function likedSnapshot(): string {
  try {
    return localStorage.getItem(LIKED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function saveLiked(ids: Set<string>) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify([...ids]));
  } catch {
    // Private browsing; the like still counts, it just won't show as yours after a reload.
  }
  likedListeners.forEach((l) => l());
}

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

export function NytwBoard({ events }: { events: NytwEvent[] }) {
  const [tab, setTab] = useState<"browse" | "submit">("browse");
  const [date, setDate] = useState(ALL);
  const [hood, setHood] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [tag, setTag] = useState(ALL);
  const [likes, setLikes] = useState(() => new Map(events.map((e) => [e.id, e.likes])));
  const likedRaw = useSyncExternalStore(subscribeLiked, likedSnapshot, () => "[]");
  const liked = useMemo(() => new Set(JSON.parse(likedRaw) as string[]), [likedRaw]);

  const options = useMemo(
    () => ({
      dates: [...new Set(events.map((e) => e.event_date))].sort(),
      hoods: [...new Set(events.map((e) => e.neighborhood).filter(Boolean) as string[])].sort(),
      tags: [...new Set(events.flatMap((e) => e.tags))].sort(),
    }),
    [events],
  );

  const shown = events.filter(
    (e) =>
      (date === ALL || e.event_date === date) &&
      (hood === ALL || e.neighborhood === hood) &&
      (priority === ALL || e.priority === priority) &&
      (tag === ALL || e.tags.includes(tag)),
  );

  async function like(id: string) {
    const now = await toggleNytwLike(id, anonId());
    if (now === null) return;
    setLikes((m) => new Map(m).set(id, Math.max(0, (m.get(id) ?? 0) + (now ? 1 : -1))));
    const next = new Set(liked);
    if (now) next.add(id);
    else next.delete(id);
    saveLiked(next);
  }

  return (
    <div>
      <div className="mb-6 flex justify-center gap-2" role="tablist">
        {(
          [
            ["browse", `Browse Events (${events.length})`],
            ["submit", "Submit Event"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-brand text-white shadow-soft" : "border border-line bg-white text-ink hover:border-brand"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "submit" ? (
        <SubmitEvent />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)}>
              <option value={ALL}>All Dates</option>
              {options.dates.map((d) => (
                <option key={d} value={d}>
                  {dayLabel(d)}
                </option>
              ))}
            </Select>
            <Select aria-label="Neighborhood" value={hood} onChange={(e) => setHood(e.target.value)}>
              <option value={ALL}>All Neighborhoods</option>
              {options.hoods.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </Select>
            <Select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value={ALL}>All Priorities</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal</option>
            </Select>
            <Select aria-label="Tag" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value={ALL}>All Tags</option>
              {options.tags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>

          {shown.length === 0 ? (
            <p className="py-16 text-center text-muted">No events match your filters</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {shown.map((e) => (
                <Card key={e.id} className={e.priority === "high" ? "border-gold/60" : ""}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-bold">
                      {e.priority === "high" && <Star className="mr-1.5 inline size-4 fill-gold text-gold" aria-label="High priority" />}
                      {e.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => like(e.id)}
                      aria-pressed={liked.has(e.id)}
                      aria-label={liked.has(e.id) ? "Unlike" : "Like"}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1 text-sm text-muted hover:border-red-300"
                    >
                      <Heart className={`size-4 ${liked.has(e.id) ? "fill-red-500 text-red-500" : ""}`} />
                      {likes.get(e.id) ?? 0}
                    </button>
                  </div>
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                    <CalendarDays className="size-4 text-brand" />
                    {dayLabel(e.event_date)}
                    {e.time && ` · ${e.time}`}
                  </p>
                  {(e.address || e.neighborhood) && (
                    <p className="mt-1 flex items-start gap-2 text-sm text-muted">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                      {[e.neighborhood, e.address].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {e.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.tags.map((t) => (
                        <span key={t} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {e.link && (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      RSVP <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubmitEvent() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitNytwEvent, null);
  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      {state?.ok ? (
        <FormStatus state={state} />
      ) : (
        <form action={action} className="relative space-y-5">
          <Honeypot />
          <p className="text-sm text-muted">Know a faith- or tech-aligned event during NY Tech Week? Send it in and we’ll review it.</p>
          <Field label="Event name *">
            <Input name="name" required maxLength={200} />
          </Field>
          <Field label="Link (RSVP or event page)">
            <Input name="link" type="url" maxLength={500} placeholder="https://" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date">
              <Input name="date" type="date" />
            </Field>
            <Field label="Time">
              <Input name="time" maxLength={60} placeholder="6–9 PM" />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Address">
              <Input name="address" maxLength={300} />
            </Field>
            <Field label="Neighborhood">
              <Input name="neighborhood" maxLength={80} placeholder="Flatiron" />
            </Field>
          </div>
          <Field label="Anything else we should know?">
            <Textarea name="details" maxLength={3000} rows={3} />
          </Field>
          <Field label="Your email (optional)" hint="In case we have a question about the event">
            <Input name="email" type="email" maxLength={254} />
          </Field>
          <FormStatus state={state} />
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Submit Event"}
          </Button>
        </form>
      )}
    </Card>
  );
}
