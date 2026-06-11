"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
    } else {
      router.push("/home");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--dms-bg)] px-4 py-8">
      {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--dms-primary)]/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--dms-primary)]/3 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dms-primary)] text-xl font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
            D
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--dms-text)]">Distributor Management</h1>
            <p className="mt-1 text-sm text-[var(--dms-text-muted)]">Sign in to your account</p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--dms-surface)] p-6 shadow-xl shadow-black/20 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-[var(--dms-danger)]/20 bg-[var(--dms-danger-muted)] px-4 py-3 text-sm font-medium text-[var(--dms-danger)]">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                className="w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-[var(--dms-primary)] hover:text-[var(--dms-primary-hover)] transition">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-xl bg-[var(--dms-primary)] text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/15 transition hover:bg-[var(--dms-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { title: "Receive", desc: "Incoming stock" },
                { title: "Bill", desc: "Track billing" },
                { title: "Deliver", desc: "Shop dispatch" },
              ].map((item) => (
                <div key={item.title} className="rounded-lg bg-white/[0.03] px-2 py-3">
                  <p className="text-xs font-semibold text-[var(--dms-text)]">{item.title}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--dms-text-muted)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--dms-text-muted)]">
          Supabase auth activates once environment keys are configured.
        </p>
      </div>
    </main>
  );
}
