import type { ComponentProps, ReactNode } from "react";

export function Section({ id, className = "", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-20 sm:px-6 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function Heading({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <h2 className="font-display text-4xl font-bold text-ink sm:text-5xl">{title}</h2>
      {lead && <p className="mt-4 text-lg text-muted">{lead}</p>}
    </div>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line/60 bg-white p-6 shadow-card ${className}`}>{children}</div>;
}

export function IconBadge({ tone = "brand", children }: { tone?: "brand" | "gold" | "hope"; children: ReactNode }) {
  const tones = { brand: "bg-brand-soft text-brand", gold: "bg-gold-soft text-amber-700", hope: "bg-emerald-50 text-hope" };
  return <div className={`mb-4 inline-flex size-12 items-center justify-center rounded-xl ${tones[tone]}`}>{children}</div>;
}

export function PageHero({ title, lead }: { title: string; lead: ReactNode }) {
  return (
    <div className="bg-gradient-to-b from-brand-soft to-paper px-4 pt-16 pb-10 text-center sm:px-6">
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">{lead}</p>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const control =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none";

export const Input = (p: ComponentProps<"input">) => <input {...p} className={control} />;
export const Textarea = (p: ComponentProps<"textarea">) => <textarea rows={5} {...p} className={control} />;
export const Select = (p: ComponentProps<"select">) => <select {...p} className={control} />;

export function Button({ className = "", ...p }: ComponentProps<"button">) {
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-white shadow-soft transition-colors hover:bg-brand-deep disabled:opacity-60 ${className}`}
    />
  );
}

/** A field people never see but form-filling bots do; the server drops anything that has it. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
      <label>
        Leave this empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

/** The result line under a form. */
export function FormStatus({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? "text-hope" : "text-red-600"}`}>
      {state.message}
    </p>
  );
}
