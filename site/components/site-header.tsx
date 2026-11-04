"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { APP_URL, NAV } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="Christians Innovate home">
          <Image src="/logo.png" alt="Christians Innovate" width={60} height={48} priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={APP_URL}
            className="rounded-full border border-brand px-4 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
          >
            Login
          </a>
          <a
            href={APP_URL}
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-deep"
          >
            Join
          </a>
        </div>
        <button
          type="button"
          className="-mr-2 rounded-md p-2 text-ink lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line/70 px-4 pb-4 lg:hidden" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-3 text-ink">
              {n.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2">
            <a href={APP_URL} className="flex-1 rounded-full border border-brand py-2 text-center text-sm font-medium text-brand">
              Login
            </a>
            <a href={APP_URL} className="flex-1 rounded-full bg-brand py-2 text-center text-sm font-medium text-white">
              Join
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
