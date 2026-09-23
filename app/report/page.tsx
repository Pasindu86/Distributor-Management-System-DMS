"use client";

import Sidebar from "../components/sidebar";
import ReportClient from "./report-client";
import RouteGuard from "../components/route-guard";

export default function ReportPage() {
  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-[var(--dms-bg)]">
        <Sidebar />

        <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
          <div className="p-3 sm:p-4 lg:p-6">
            {/* Page header */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-[var(--dms-text)]">Reports</h1>
            </div>

            {/* Report Content */}
            <ReportClient />
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
