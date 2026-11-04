"use server";

import { supabase } from "@/lib/supabase";

export type FormState = { ok: boolean; message: string } | null;

const unavailable: FormState = { ok: false, message: "We couldn’t send that right now. Please try again in a moment." };
const thanks = (message: string): FormState => ({ ok: true, message });

const text = (f: FormData, key: string) => String(f.get(key) ?? "").trim();
const isBot = (f: FormData) => text(f, "website") !== "";
const looksLikeEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

/** Contact form → the admin Inbox in the app. */
export async function sendContact(_: FormState, f: FormData): Promise<FormState> {
  if (isBot(f)) return thanks("Thanks! We’ll be in touch soon.");
  const name = text(f, "name");
  const email = text(f, "email");
  const topic = text(f, "topic");
  const message = text(f, "message");
  if (!name || !looksLikeEmail(email) || !topic || message.length < 2) {
    return { ok: false, message: "Please fill in your name, a valid email, a topic and your message." };
  }
  const db = supabase();
  if (!db) return unavailable;
  const { error } = await db.rpc("site_contact", { p_name: name, p_email: email, p_topic: topic, p_message: message });
  return error ? unavailable : thanks("Thanks! Your message is on its way, and we’ll be in touch soon.");
}

/** Suggestion box → the admin Inbox; name and email are optional. */
export async function sendSuggestion(_: FormState, f: FormData): Promise<FormState> {
  if (isBot(f)) return thanks("Thank you for your suggestion!");
  const email = text(f, "email");
  const suggestion = text(f, "suggestion");
  if (suggestion.length < 2) return { ok: false, message: "Please write your suggestion." };
  if (email && !looksLikeEmail(email)) return { ok: false, message: "That email doesn’t look right." };
  const db = supabase();
  if (!db) return unavailable;
  const { error } = await db.rpc("site_contact", {
    p_name: text(f, "name") || null,
    p_email: email || null,
    p_topic: "Suggestion",
    p_message: suggestion,
  });
  return error ? unavailable : thanks("Thank you for your suggestion! It helps us serve the community better.");
}

/** Bible Year signup → the mailing list, plus a note in the Inbox. */
export async function joinBibleYear(_: FormState, f: FormData): Promise<FormState> {
  if (isBot(f)) return thanks("Welcome to Bible Year!");
  const name = text(f, "name");
  const email = text(f, "email");
  if (!name || !looksLikeEmail(email)) return { ok: false, message: "Please add your name and a valid email." };
  const db = supabase();
  if (!db) return unavailable;
  const { error } = await db.rpc("site_signup", { p_name: name, p_email: email, p_referred_by: text(f, "referred_by") || null });
  return error ? unavailable : thanks("Welcome to Bible Year! Watch your inbox for the reading plan and meeting invites.");
}

/** NYTW event suggestion → waits for an admin to review it. */
export async function submitNytwEvent(_: FormState, f: FormData): Promise<FormState> {
  if (isBot(f)) return thanks("Thanks! We’ll review it shortly.");
  const name = text(f, "name");
  const email = text(f, "email");
  const link = text(f, "link");
  if (!name) return { ok: false, message: "Please add the event’s name." };
  if (email && !looksLikeEmail(email)) return { ok: false, message: "That email doesn’t look right." };
  if (link && !/^https?:\/\//i.test(link)) return { ok: false, message: "The link should start with http:// or https://." };
  const db = supabase();
  if (!db) return unavailable;
  const { error } = await db.from("nytw_event_submissions").insert({
    name,
    link: link || null,
    event_date: text(f, "date") || null,
    time: text(f, "time") || null,
    address: text(f, "address") || null,
    neighborhood: text(f, "neighborhood") || null,
    details: text(f, "details") || null,
    submitter_email: email || null,
  });
  return error ? unavailable : thanks("Thanks! We’ll review the event and add it to the list.");
}

/** Likes or unlikes an event for this browser; returns whether it's now liked, or null on failure. */
export async function toggleNytwLike(eventId: string, anonId: string): Promise<boolean | null> {
  const db = supabase();
  if (!db) return null;
  const { data, error } = await db.rpc("nytw_toggle_like", { p_event_id: eventId, p_anon_id: anonId });
  return error ? null : Boolean(data);
}
