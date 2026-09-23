"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import RouteGuard from "../components/route-guard";
import Logo from "../components/logo";

export default function LoginPage() {
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
    }
    // Do not router.push here. RouteGuard will automatically redirect 
    // when the auth state changes globally.
  }

  return (
    <RouteGuard>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--dms-bg)] px-4 py-8">
        {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[var(--dms-primary)]/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[var(--dms-primary)]/3 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[380px]">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={44} />
          <h1 className="text-lg font-bold text-[var(--dms-text)]">DMS</h1>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-[var(--dms-input-border)] bg-[var(--dms-surface)] p-6 shadow-xl shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-4 py-2.5 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-4 py-2.5 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 flex h-10 w-full items-center justify-center rounded-xl bg-[var(--dms-primary)] text-sm font-semibold text-slate-950 transition hover:bg-[var(--dms-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
    </RouteGuard>
  );
}
