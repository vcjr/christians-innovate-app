/** Where "Join" and "Login" send people: the member app. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.christiansinnovate.com";

/** Meetings and readings follow New York time. */
export const TIME_ZONE = "America/New_York";

export const NAV = [
  { href: "/#about", label: "About" },
  { href: "/#programs", label: "Programs" },
  { href: "/bible-year", label: "Bible Year" },
  { href: "/meetings", label: "Meetings" },
  { href: "/contact", label: "Get in Touch" },
  { href: "/nytw", label: "NYTW Shortlist" },
];

/** The calendar date (YYYY-MM-DD) in New York for [at]. */
export function nyDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** "Thursday, November 5". */
export function longDay(at: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "long", month: "long", day: "numeric" }).format(at);
}

/** "7:00 PM ET". */
export function timeOfDay(at: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(at) + " ET";
}
