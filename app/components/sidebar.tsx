"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/home",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "New Stock",
    href: "/new-stock",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    label: "Daily Out",
    href: "#daily-out",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
  {
    label: "Daily Return",
    href: "#daily-return",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "#inventory",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-white/[0.08] bg-[var(--dms-surface)]/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dms-primary)] font-bold text-slate-950 text-sm">
            D
          </div>
          <span className="text-sm font-semibold text-[var(--dms-text)]">DMS</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/5 text-[var(--dms-text-secondary)] transition hover:bg-white/10"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
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
          <aside className="absolute left-0 top-0 h-full w-[280px] animate-[slideIn_0.2s_ease-out] border-r border-white/[0.08] bg-[var(--dms-surface)] p-4">
            <SidebarContent pathname={pathname} onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop persistent sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-[var(--dms-sidebar-width)] border-r border-white/[0.08] bg-[var(--dms-surface)] p-4 lg:block">
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
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--dms-primary)] font-bold text-slate-950">
          D
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--dms-text)] tracking-tight">DMS</p>
          <p className="text-[11px] text-[var(--dms-text-muted)]">Distributor Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--dms-text-muted)]">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--dms-primary-muted)] text-[var(--dms-primary-hover)]"
                  : "text-[var(--dms-text-secondary)] hover:bg-white/5 hover:text-[var(--dms-text)]"
              }`}
            >
              <span className={isActive ? "text-[var(--dms-primary)]" : ""}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.08] pt-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--dms-surface-raised)] text-xs font-semibold text-[var(--dms-text-secondary)]">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-[var(--dms-text)]">User</p>
            <p className="truncate text-[11px] text-[var(--dms-text-muted)]">Distributor</p>
          </div>
        </div>
      </div>
    </div>
  );
}
