import { Heart } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 bg-paper py-10 text-center text-sm text-muted">
      <nav className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
        <Link href="/meetings" className="hover:text-brand">
          Meetings
        </Link>
        <Link href="/bible-year" className="hover:text-brand">
          Bible Year
        </Link>
        <Link href="/suggestions" className="hover:text-brand">
          Suggestion Box
        </Link>
        <Link href="/contact" className="hover:text-brand">
          Contact
        </Link>
      </nav>
      <p className="inline-flex items-center gap-1.5">
        Built with <Heart className="size-4 fill-red-500 text-red-500" aria-label="love" /> by Christians Innovate
      </p>
      <p className="mt-1">© {new Date().getFullYear()} Christians Innovate. All rights reserved.</p>
    </footer>
  );
}
