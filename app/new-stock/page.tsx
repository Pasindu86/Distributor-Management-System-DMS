"use client";

import Sidebar from "../components/sidebar";
import Tabs from "../components/tabs";
import AddStockForm from "./add-stock-form";
import PurchaseHistory from "./purchase-history";
import RouteGuard from "../components/route-guard";

export default function NewStockPage() {
  const tabs = [
    {
      id: "add",
      label: "New",
      content: <AddStockForm />,
    },
    {
      id: "history",
      label: "History",
      content: <PurchaseHistory />,
    },
  ];

  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-[var(--dms-bg)]">
        <Sidebar />

      <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Page header */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--dms-text)] sm:text-3xl">New Stock</h1>
            <p className="mt-1 text-sm text-[var(--dms-text-muted)]">
              Record incoming shipments and view purchase history.
            </p>
          </div>

          {/* Tabs - full width */}
          <Tabs tabs={tabs} defaultTab="add" />
        </div>
      </main>
    </div>
    </RouteGuard>
  );
}
