import { BookOpen, CalendarDays, Handshake, MessageCircle, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BibleYearForm } from "@/components/forms";
import { Invite } from "@/components/invite";
import { Card, Heading, IconBadge, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bible Year",
  description: "Read through the Bible together as a community, with regular meetings and real connections.",
};

const expect = [
  { icon: BookOpen, title: "Annual Bible Plan", text: "Every year we follow a structured reading plan, walking through Scripture together as a community." },
  { icon: CalendarDays, title: "Regular Meetings", text: "Join our interactive discussions on the readings. Share insights, ask questions, and grow together." },
  { icon: Sparkles, title: "Outside Sessions", text: "Community members organize additional sessions—topical studies, book deep-dives, and more." },
  {
    icon: MessageCircle,
    title: "Interactive Discussions",
    text: "Guided networking, prayer requests, praise reports, and meaningful conversations that build relationships.",
  },
  {
    icon: Handshake,
    title: "Real Connections",
    text: "Members have found prayer partners, friends, business partners, clients, and job referrals through our community.",
  },
];

export default function BibleYear() {
  return (
    <>
      <PageHero
        title="Bible Year"
        lead="Journey through Scripture together. Last year, we read through the entire Bible as a community. This year, we continue building on that foundation."
      />

      <Section className="pt-10">
        <Heading title="What to Expect" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {expect.map((e) => (
            <Card key={e.title}>
              <IconBadge tone="gold">
                <e.icon className="size-6" />
              </IconBadge>
              <h3 className="font-display text-xl font-bold">{e.title}</h3>
              <p className="mt-2 text-muted">{e.text}</p>
            </Card>
          ))}
          <Card className="bg-brand-soft/60">
            <IconBadge>
              <Users className="size-6" />
            </IconBadge>
            <h3 className="font-display text-xl font-bold">Stay Connected</h3>
            <p className="mt-2 text-muted">Beyond our meetings, we stay connected through multiple channels:</p>
            <ul className="mt-3 space-y-1.5 text-sm font-medium">
              <li>
                <Link href="/contact" className="text-brand hover:underline">
                  LinkedIn Community
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-brand hover:underline">
                  WhatsApp Group
                </Link>
              </li>
              <li>
                <Link href="/suggestions" className="text-muted hover:text-brand">
                  + Suggest more channels!
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section id="join" className="bg-white/60">
        <div className="mx-auto max-w-lg">
          <Heading title="Join Bible Year" lead="Sign up to receive reading plans, meeting invites, and community updates." />
          <Card>
            <BibleYearForm />
          </Card>
        </div>
      </Section>

      <Invite
        path="/bible-year"
        title="Invite Fellow Believers and Seekers"
        lead="Know someone who would love to read through Scripture with a community? Invite them to join Bible Year!"
      />
    </>
  );
}
