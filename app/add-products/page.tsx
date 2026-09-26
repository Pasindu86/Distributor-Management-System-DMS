"use client";

import Sidebar from "../components/sidebar";
import Tabs from "../components/tabs";
import AddProductForm from "./add-product-form";
import EditProductForm from "./edit-product-form";
import RouteGuard from "../components/route-guard";

export default function AddProductsPage() {
  const tabs = [
    {
      id: "add",
      label: "Add New",
      content: <AddProductForm />,
    },
    {
      id: "edit",
      label: "Edit",
      content: <EditProductForm />,
    },
  ];

  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-[var(--dms-bg)]">
        <Sidebar />

      <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--dms-text)]">Products</h1>
          </div>

          <Tabs tabs={tabs} defaultTab="add" />
        </div>
      </main>
    </div>
    </RouteGuard>
  );
}

