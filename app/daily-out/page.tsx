"use client";

import Sidebar from "../components/sidebar";
import Tabs from "../components/tabs";
import AddDailyOutForm from "./add-daily-out-form";
import SalesHistory from "./sales-history";

export default function DailyOutPage() {
  const tabs = [
    {
      id: "add",
      label: "Add Daily Out",
      content: <AddDailyOutForm />,
    },
    {
      id: "history",
      label: "Sales History",
      content: <SalesHistory />,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--dms-bg)]">
      <Sidebar />

      <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--dms-text)] sm:text-3xl">Daily Out</h1>
            <p className="mt-1 text-sm text-[var(--dms-text-muted)]">
              Record daily product outgoing and view sales history.
            </p>
          </div>

          {/* Tabs - full width */}
          <Tabs tabs={tabs} defaultTab="add" />
        </div>
      </main>
    </div>
  );
}
