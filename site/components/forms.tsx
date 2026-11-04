"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";

import { joinBibleYear, sendContact, sendSuggestion, type FormState } from "@/app/actions";

import { Button, Field, FormStatus, Honeypot, Input, Select, Textarea } from "./ui";

const topics = [
  "General Question",
  "Suggestion or Feedback",
  "Bible Year Program",
  "Skill Share Sessions",
  "Session or Topic Idea",
  "Partnership or Collaboration",
  "Prayer Request",
  "Other",
];

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, null);
  if (state?.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="relative space-y-5">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your Name *">
          <Input name="name" required maxLength={120} autoComplete="name" />
        </Field>
        <Field label="Email *">
          <Input name="email" type="email" required maxLength={254} autoComplete="email" />
        </Field>
      </div>
      <Field label="What’s this about? *">
        <Select name="topic" required defaultValue="">
          <option value="" disabled>
            Select a topic
          </option>
          {topics.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </Field>
      <Field label="Your Message *">
        <Textarea name="message" required maxLength={5000} />
      </Field>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        <Send className="size-4" />
        {pending ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}

export function SuggestionForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(sendSuggestion, null);
  if (state?.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="relative space-y-5">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name (optional)">
          <Input name="name" maxLength={120} autoComplete="name" />
        </Field>
        <Field label="Email (optional)" hint="If you’d like us to follow up with you">
          <Input name="email" type="email" maxLength={254} autoComplete="email" />
        </Field>
      </div>
      <Field label="Your Suggestion *">
        <Textarea name="suggestion" required maxLength={5000} />
      </Field>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Submit Suggestion"}
      </Button>
    </form>
  );
}

export function BibleYearForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(joinBibleYear, null);
  if (state?.ok) return <FormStatus state={state} />;
  return (
    <form action={action} className="relative space-y-5">
      <Honeypot />
      <Field label="Name *">
        <Input name="name" required maxLength={120} autoComplete="name" />
      </Field>
      <Field label="Email *">
        <Input name="email" type="email" required maxLength={254} autoComplete="email" />
      </Field>
      <Field label="Who referred you? (optional)">
        <Input name="referred_by" maxLength={120} />
      </Field>
      <FormStatus state={state} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Joining…" : "Join Bible Year"}
      </Button>
    </form>
  );
}
