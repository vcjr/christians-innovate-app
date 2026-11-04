"use client";

import { Check, Copy, Share2, Users } from "lucide-react";
import { useState } from "react";

import { Section } from "./ui";

/** Copy or share a link to [path] so members can invite friends. */
export function Invite({ path = "/", title, lead }: { path?: string; title: string; lead: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => new URL(path, window.location.origin).toString();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url());
    }
  }

  async function share() {
    const data = { title: "Christians Innovate", text: lead, url: url() };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // Closed the share sheet.
      }
    } else {
      await copy();
    }
  }

  return (
    <Section className="bg-gradient-to-b from-paper to-brand-soft/60">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 inline-flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Users className="size-6" />
        </div>
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg text-muted">{lead}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium shadow-sm hover:border-brand"
          >
            {copied ? <Check className="size-4 text-hope" /> : <Copy className="size-4" />}
            {copied ? "Link copied" : "Copy Invite Link"}
          </button>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-soft hover:bg-brand-deep"
          >
            <Share2 className="size-4" />
            Share with Others
          </button>
        </div>
      </div>
    </Section>
  );
}
