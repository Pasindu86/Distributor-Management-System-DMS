"use client";

import Sidebar from "../components/sidebar";
import InventoryDashboardClient from "./inventory-dashboard-client";
import RouteGuard from "../components/route-guard";

export default function HomeDashboardPage() {
  return (
    <RouteGuard>
      <div className="min-h-screen bg-[var(--dms-bg)]">
        <Sidebar />

      <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--dms-text)] sm:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--dms-text-muted)]">
              Overview of inventory, stock status, and recent activity.
            </p>
          </div>

          {/* Inventory section - full width */}
          <section className="rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface)] p-3 sm:p-4 lg:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--dms-text)]">Inventory</h2>
              <span className="rounded-md bg-[var(--dms-hover-bg)] px-2.5 py-1 text-xs font-medium text-[var(--dms-text-muted)]">
                Live data
              </span>
            </div>
            <InventoryDashboardClient />
          </section>
        </div>
      </main>
    </div>
    </RouteGuard>
  );
}
