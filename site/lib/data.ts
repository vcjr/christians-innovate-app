import "server-only";

import { supabase } from "./supabase";
import { nyDate } from "./site";

export type Meeting = { id: string; title: string; description: string | null; startsAt: Date };

type MeetingRow = { id: string; title: string; description: string | null; meeting_date: string };

const toMeeting = (r: MeetingRow): Meeting => ({ id: r.id, title: r.title, description: r.description, startsAt: new Date(r.meeting_date) });

/** Published meetings that haven't ended (assuming two hours), soonest first. */
export async function upcomingMeetings(limit = 12): Promise<Meeting[]> {
  const db = supabase();
  if (!db) return [];
  const since = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const { data, error } = await db
    .from("meetings")
    .select("id, title, description, meeting_date")
    .eq("is_active", true)
    .gte("meeting_date", since.toISOString())
    .order("meeting_date", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data as MeetingRow[]).map(toMeeting);
}

/** Today's passage in the default reading plan, if one is assigned to today. */
export async function todaysReading(): Promise<string | null> {
  const db = supabase();
  if (!db) return null;
  const { data, error } = await db
    .from("plan_days")
    .select("scripture_reference, reading_plans!inner(is_default)")
    .eq("reading_plans.is_default", true)
    .eq("date_assigned", nyDate())
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { scripture_reference: string }).scripture_reference;
}

export type NytwEvent = {
  id: string;
  name: string;
  event_date: string;
  time: string | null;
  address: string | null;
  neighborhood: string | null;
  priority: "high" | "normal";
  tags: string[];
  link: string | null;
  likes: number;
};

export async function nytwEvents(): Promise<NytwEvent[]> {
  const db = supabase();
  if (!db) return [];
  const [events, counts] = await Promise.all([
    db.from("nytw_events").select("id, name, event_date, time, address, neighborhood, priority, tags, link").eq("is_active", true).order("event_date", { ascending: true }),
    db.rpc("nytw_like_counts"),
  ]);
  if (events.error) return [];
  const likes = new Map<string, number>((counts.data ?? []).map((c: { event_id: string; likes: number }) => [c.event_id, Number(c.likes)]));
  return (events.data as Omit<NytwEvent, "likes">[]).map((e) => ({ ...e, likes: likes.get(e.id) ?? 0 }));
}
