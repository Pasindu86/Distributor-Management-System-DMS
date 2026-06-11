"use client";

import Sidebar from "../components/sidebar";
import AddProductForm from "./add-product-form";
import RouteGuard from "../components/route-guard";

export default function AddProductsPage() {
  return (
    <RouteGuard requireAdmin>
      <div className="min-h-screen bg-[var(--dms-bg)]">
        <Sidebar />

      <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-[var(--dms-text)] sm:text-3xl">Add Products</h1>
            <p className="mt-1 text-sm text-[var(--dms-text-muted)]">
              Add new products to your inventory catalog.
            </p>
          </div>

          <AddProductForm />
        </div>
      </main>
    </div>
    </RouteGuard>
  );
}
