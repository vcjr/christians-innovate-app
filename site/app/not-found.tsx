import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 py-28 text-center">
      <p className="font-display text-7xl font-bold text-brand">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold">This page isn’t here</h1>
      <p className="mt-3 text-muted">It may have moved, or the link may be mistyped.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-brand px-6 py-3 font-medium text-white shadow-soft hover:bg-brand-deep">
        Back home
      </Link>
    </div>
  );
}
