import { BookOpen, Clock, Hammer, Mail, Rocket, Target, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Invite } from "@/components/invite";
import { MeetingBar } from "@/components/meeting-bar";
import { Card, Heading, IconBadge, Section } from "@/components/ui";
import { todaysReading, upcomingMeetings } from "@/lib/data";
import { bibleGatewayUrl, scriptureFor } from "@/lib/scriptures";
import { APP_URL, nyDate } from "@/lib/site";

// Meetings, the reading and the verse change through the day.
export const revalidate = 300;

const horizons = [
  { years: "5 Years", icon: Clock, text: "Short-term innovations that address immediate needs in our communities today." },
  { years: "50 Years", icon: Target, text: "Long-term solutions that will transform industries and create lasting impact." },
  { years: "500 Years", icon: Users, text: "Generational institutions that will bless future generations of Believers." },
];

const programs = [
  {
    title: "Bible Year",
    icon: BookOpen,
    tone: "gold" as const,
    href: "/bible-year",
    text: "Journey through God’s Word together—a community initiative to read Scripture systematically and grow in faith.",
  },
  {
    title: "Skill Share",
    icon: Hammer,
    tone: "hope" as const,
    href: "/contact",
    text: "Iron sharpens iron. Learn from fellow believers as we share our God-given talents and grow together.",
  },
  {
    title: "Email List",
    icon: Mail,
    tone: "brand" as const,
    href: "/bible-year#join",
    text: "Stay connected with the latest news, events, and stories from our community of believers building for God’s glory.",
  },
  {
    title: "Built By CI",
    icon: Rocket,
    tone: "gold" as const,
    soon: true,
    text: "Discover products and services created by our community—redemptive innovation in action.",
  },
];

export default async function Home() {
  const [meetings, reading] = await Promise.all([upcomingMeetings(1), todaysReading()]);
  const verse = scriptureFor(nyDate());

  return (
    <>
      <MeetingBar meeting={meetings[0] ?? null} reading={reading} />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-soft via-paper to-paper px-4 pt-14 pb-20 text-center sm:px-6">
        <div className="pointer-events-none absolute -top-24 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="sr-only">Christians Innovate</h1>
          <Image src="/logo.png" alt="" width={300} height={240} priority className="mx-auto h-auto w-56 sm:w-72" />
          <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-amber-600 uppercase">
            ✦ Fellowship Scripture ✦
          </p>
          <blockquote className="mt-4 font-display text-2xl leading-snug text-ink sm:text-3xl">“{verse.text}”</blockquote>
          <a
            href={bibleGatewayUrl(verse.reference)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block font-medium text-brand hover:underline"
          >
            — {verse.reference}
          </a>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={APP_URL} className="rounded-full bg-brand px-7 py-3 font-medium text-white shadow-soft hover:bg-brand-deep">
              Join the Community
            </a>
            <a href="#about" className="rounded-full border border-line bg-white px-7 py-3 font-medium text-ink hover:border-brand">
              Learn More
            </a>
          </div>
        </div>
      </section>

      <Section id="about">
        <Heading
          title="Building for Generations"
          lead={
            <>
              Christians Innovate was founded to empower Believers to boldly build redemptive products and services for the next{" "}
              <strong className="text-brand">5</strong>, <strong className="text-brand">50</strong>, and{" "}
              <strong className="text-brand">500</strong> years — short, long, and generational terms.
            </>
          }
        />
        <div className="grid gap-6 md:grid-cols-3">
          {horizons.map((h) => (
            <Card key={h.years} className="text-center">
              <IconBadge>
                <h.icon className="size-6" />
              </IconBadge>
              <h3 className="font-display text-2xl font-bold">{h.years}</h3>
              <p className="mt-2 text-muted">{h.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="programs" className="bg-white/60">
        <Heading title="Get Involved" lead="Join one or all of our community initiatives and grow alongside fellow believers." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((p) => {
            const body = (
              <Card className="relative h-full transition-transform hover:-translate-y-1">
                {p.soon && (
                  <span className="absolute top-4 right-4 rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Coming Soon
                  </span>
                )}
                <IconBadge tone={p.tone}>
                  <p.icon className="size-6" />
                </IconBadge>
                <h3 className="font-display text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted">{p.text}</p>
              </Card>
            );
            return p.href ? (
              <Link key={p.title} href={p.href} className="block">
                {body}
              </Link>
            ) : (
              <div key={p.title}>{body}</div>
            );
          })}
        </div>
      </Section>

      <Invite
        title="Invite Fellow Believers and Seekers"
        lead="Know someone who would be blessed by Christians Innovate? Share the community with them and grow together in faith and innovation."
      />
    </>
  );
}
