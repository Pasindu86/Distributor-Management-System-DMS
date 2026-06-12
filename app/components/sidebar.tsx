"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { supabase } from "@/lib/supabase/client";

const navItems = [
  {
    label: "Dashboard",
    href: "/home",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    roles: ["admin", "user"],
  },
  {
    label: "New Stock",
    href: "/new-stock",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    roles: ["admin"],
  },
  {
    label: "Daily Out",
    href: "/daily-out",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    roles: ["admin"],
  },
  {
    label: "Daily Return",
    href: "/daily-return",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
    roles: ["admin"],
  },
  {
    label: "Add Products",
    href: "/add-products",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    roles: ["admin"],
  },
  {
    label: "Report (Monthly)",
    href: "/report",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center border-b border-[var(--dms-input-border)] bg-[var(--dms-surface)]/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--dms-input-border)] bg-[var(--dms-hover-bg)] text-[var(--dms-text-secondary)] transition hover:bg-[var(--dms-hover-bg-strong)]"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-primary)] font-bold text-slate-950 text-sm">
            D
          </div>
          <span className="text-sm font-semibold text-[var(--dms-text)]">DMS</span>
        </div>
      </header>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] animate-[slideIn_0.2s_ease-out] border-r border-[var(--dms-input-border)] bg-[var(--dms-surface)] p-4">
            <SidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop persistent sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[var(--dms-sidebar-width)] border-r border-[var(--dms-input-border)] bg-[var(--dms-surface)] p-4 lg:block">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { role, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const visibleNavItems = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dms-primary)] font-bold text-slate-950">
          D
        </div>
        <p className="text-base font-bold text-[var(--dms-text)] tracking-tight">DMS</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--dms-primary-muted)] text-[var(--dms-primary-hover)]"
                  : "text-[var(--dms-text-secondary)] hover:bg-[var(--dms-hover-bg)] hover:text-[var(--dms-text)]"
              }`}
            >
              <span className={isActive ? "text-[var(--dms-primary)]" : ""}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--dms-input-border)] pt-4 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--dms-text-secondary)] transition hover:bg-[var(--dms-hover-bg)] hover:text-[var(--dms-text)]"
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* User info */}
        <div className="flex items-center justify-between rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dms-surface-raised)] text-xs font-semibold text-[var(--dms-text-secondary)]">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--dms-text)]">{user?.email?.split('@')[0] || "User"}</p>
              <p className="truncate text-[11px] text-[var(--dms-text-muted)] capitalize">{role || "Distributor"}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--dms-text-muted)] transition hover:bg-[var(--dms-hover-bg)] hover:text-[var(--dms-danger)]"
            title="Log out"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

