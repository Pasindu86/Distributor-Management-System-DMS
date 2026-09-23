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
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--dms-text)]">Dashboard</h1>
          </div>

          <InventoryDashboardClient />
        </div>
      </main>
    </div>
    </RouteGuard>
  );
}
