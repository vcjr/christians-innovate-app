import type { Metadata } from "next";

import { NytwBoard } from "@/components/nytw-board";
import { APP_URL } from "@/lib/site";
import { nytwEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Christians Innovate x #NYTW — Curated Events" },
  description: "A curated list of faith- and tech-aligned events during NY Tech Week.",
};

export const revalidate = 60;

export default async function Nytw() {
  const events = await nytwEvents();
  return (
    <>
      <div className="bg-gradient-to-b from-brand-soft to-paper px-4 pt-16 pb-8 text-center sm:px-6">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Christians Innovate <span className="text-brand">x #NYTW</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">A curated list of faith- and tech-aligned events during NY Tech Week.</p>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <NytwBoard events={events} />
      </div>
      <div className="border-t border-line/60 bg-white/60 px-4 py-14 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold">Christians Innovate</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Christians Innovate is a community of faith-driven entrepreneurs, technologists, and innovators building the future. Join us
          for meaningful conversations at NY Tech Week.
        </p>
        <a href={APP_URL} className="mt-5 inline-block font-medium text-brand hover:underline">
          Join Christians Innovate →
        </a>
      </div>
    </>
  );
}
