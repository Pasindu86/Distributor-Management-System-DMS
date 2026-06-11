"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DetailCell from "@/app/components/detail-cell";

export interface InventoryItem {
  item_id: number;
  item_name: string;
  item_type: string;
  weight_grams: number | string;
  purchase_price: number | string;
  selling_price: number | string;
  units_per_pack: number;
  stock_quantity: number;
  created_at: string | null;
  updated_at: string | null;
}

function toNum(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function unitsStock(item: InventoryItem) {
  if (item.units_per_pack === 0) return 0;
  return Math.floor(item.stock_quantity / item.units_per_pack);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InventoryDashboardClient() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadInventory() {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from("inventory")
        .select("item_id, item_name, item_type, weight_grams, purchase_price, selling_price, units_per_pack, stock_quantity, created_at, updated_at")
        .order("item_id", { ascending: true });

      if (!isActive) return;

      if (queryError) {
        setError(queryError.message);
        setItems([]);
        setLoading(false);
        return;
      }

      setItems((data ?? []) as InventoryItem[]);
      setLoading(false);
    }

    loadInventory();
    return () => { isActive = false; };
  }, []);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.item_name.toLowerCase().includes(q) ||
      item.item_type.toLowerCase().includes(q) ||
      String(toNum(item.weight_grams)).includes(q)
    );
  });

  const totalPieces = items.reduce((s, i) => s + i.stock_quantity, 0);
  const totalPacks = items.reduce((s, i) => s + unitsStock(i), 0);
  const inStockCount = items.filter((i) => i.stock_quantity > 0).length;
  const outOfStockCount = items.filter((i) => i.stock_quantity === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--dms-primary)]/30 border-t-[var(--dms-primary)]" />
          <p className="text-sm text-[var(--dms-text-muted)]">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dms-danger-muted)]">
            <svg className="h-5 w-5 text-[var(--dms-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--dms-danger)]">{error}</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--dms-hover-bg)]">
            <svg className="h-5 w-5 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm text-[var(--dms-text-muted)]">No inventory items found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Total Items</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{items.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Total Pieces</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{totalPieces.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Total Packs</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-primary)]">{totalPacks.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Stock Status</p>
          <p className="mt-1 text-sm">
            <span className="font-bold text-[var(--dms-primary)]">{inStockCount}</span>
            <span className="text-[var(--dms-text-muted)]"> / </span>
            <span className="font-bold text-[var(--dms-danger)]">{outOfStockCount}</span>
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, or weight..."
            className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] py-2.5 pl-10 pr-4 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dms-text-muted)] hover:text-[var(--dms-text)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {search && (
          <p className="mt-2 text-xs text-[var(--dms-text-muted)]">
            Showing {filtered.length} of {items.length} items
          </p>
        )}
      </div>

      {/* Mobile card layout */}
      <div className="space-y-2.5 lg:hidden">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.item_id;
          const packs = unitsStock(item);

          return (
            <div
              key={item.item_id}
              className={`rounded-xl border transition ${
                isExpanded ? "border-[var(--dms-primary)]/20 bg-white/[0.03]" : "border-[var(--dms-card-border)] bg-white/[0.015]"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.item_id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    item.stock_quantity > 0
                      ? "bg-[var(--dms-primary-muted)] text-[var(--dms-primary)]"
                      : "bg-[var(--dms-danger-muted)] text-[var(--dms-danger)]"
                  }`}
                >
                  {packs}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--dms-text)]">{item.item_name}</p>
                  <p className="mt-0.5 text-xs text-[var(--dms-text-muted)]">
                    {item.item_type} · {toNum(item.weight_grams)}g
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs text-[var(--dms-text-muted)]">Packs</p>
                  <p className="text-sm font-semibold text-[var(--dms-text)]">{packs}</p>
                </div>

                <svg
                  className={`h-4 w-4 shrink-0 text-[var(--dms-text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="border-t border-[var(--dms-card-border)] px-4 py-3">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    <DetailCell label="Total Pieces" value={String(item.stock_quantity)} />
                    <DetailCell label="Pcs per Pack" value={String(item.units_per_pack)} />
                    <DetailCell label="Packs Available" value={String(packs)} highlight />
                    <DetailCell label="Weight" value={`${toNum(item.weight_grams)}g`} />
                    <DetailCell label="Buy Price" value={`Rs. ${toNum(item.purchase_price).toFixed(2)}`} />
                    <DetailCell label="Sell Price" value={`Rs. ${toNum(item.selling_price).toFixed(2)}`} highlight />
                    <DetailCell label="Last Updated" value={formatDate(item.updated_at)} span />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto rounded-lg border border-[var(--dms-card-border)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--dms-input-border)] bg-[var(--dms-card-bg)]">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">#</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Item Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Category</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] text-center">Weight</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] text-right">Buy Price</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] text-right">Sell Price</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] text-center">Pcs / Pack</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] text-center">Total Pieces</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-primary)] text-center font-bold">Packs Available</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((item) => {
                const packs = unitsStock(item);
                return (
                  <tr key={item.item_id} className="transition hover:bg-[var(--dms-card-bg)]">
                    <td className="px-5 py-3.5 font-mono text-xs text-[var(--dms-text-muted)]">{item.item_id}</td>
                    <td className="px-5 py-3.5 font-medium text-[var(--dms-text)]">{item.item_name}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-md bg-[var(--dms-hover-bg)] px-2 py-0.5 text-xs font-medium text-[var(--dms-text-secondary)]">
                        {item.item_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-[var(--dms-text-secondary)]">
                      {toNum(item.weight_grams)}g
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[var(--dms-text-secondary)]">
                      Rs. {toNum(item.purchase_price).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-[var(--dms-primary)]">
                      Rs. {toNum(item.selling_price).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-[var(--dms-text-secondary)]">
                      {item.units_per_pack}
                    </td>
                    <td className="px-5 py-3.5 text-center text-[var(--dms-text-secondary)]">
                      {item.stock_quantity}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex min-w-[48px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ${
                          packs > 0
                            ? "bg-[var(--dms-primary-muted)] text-[var(--dms-primary)]"
                            : "bg-[var(--dms-danger-muted)] text-[var(--dms-danger)]"
                        }`}
                      >
                        {packs > 0 ? packs : "0"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-[var(--dms-text-muted)]">
                      {formatDate(item.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
