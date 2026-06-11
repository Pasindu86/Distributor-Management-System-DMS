"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DetailCell from "@/app/components/detail-cell";

interface DailyOutRecord {
  out_id: number;
  out_date: string;
  total_selling_price: number | string;
  discount_type: string;
  discount_value: number | string;
  discount_amount: number | string;
  final_amount: number | string;
  total_profit: number | string;
  notes: string | null;
  created_at: string | null;
}

interface DailyOutItem {
  id: number;
  item_id: number;
  quantity_out: number;
  selling_price_per_unit: number | string;
  purchase_price_per_unit: number | string;
  line_total: number | string;
  inventory: {
    item_name: string;
    item_type: string;
    weight_grams: number | string;
    units_per_pack: number;
  };
}

function toNum(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SalesHistory() {
  const [records, setRecords] = useState<DailyOutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<DailyOutItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("daily_out")
        .select("out_id, out_date, total_selling_price, discount_type, discount_value, discount_amount, final_amount, total_profit, notes, created_at")
        .order("out_date", { ascending: false });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setRecords((data ?? []) as DailyOutRecord[]);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleExpand(outId: number) {
    if (expandedId === outId) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }

    setExpandedId(outId);
    setLoadingItems(true);

    const { data } = await supabase
      .from("daily_out_items")
      .select("id, item_id, quantity_out, selling_price_per_unit, purchase_price_per_unit, line_total, inventory(item_name, item_type, weight_grams, units_per_pack)")
      .eq("out_id", outId)
      .order("id");

    setExpandedItems((data ?? []) as unknown as DailyOutItem[]);
    setLoadingItems(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-sm text-[var(--dms-text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--dms-primary)] border-t-transparent" />
          Loading history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[var(--dms-danger)]">{error}</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dms-hover-bg)]">
          <svg className="h-6 w-6 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <p className="mt-3 text-sm text-[var(--dms-text-muted)]">No daily out records yet.</p>
        <p className="mt-1 text-xs text-[var(--dms-text-muted)]">Record your first daily out using the &quot;Add Daily Out&quot; tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {records.map((r) => {
        const isExpanded = expandedId === r.out_id;
        const profit = toNum(r.total_profit);

        return (
          <div
            key={r.out_id}
            className={`rounded-xl border transition ${
              isExpanded ? "border-[var(--dms-primary)]/20 bg-white/[0.03]" : "border-[var(--dms-card-border)] bg-white/[0.015]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggleExpand(r.out_id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--dms-primary-muted)]">
                <svg className="h-5 w-5 text-[var(--dms-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--dms-text)]">
                  {formatDate(r.out_date)}
                </p>
                {r.notes && (
                  <p className="mt-0.5 truncate text-xs text-[var(--dms-text-muted)]">{r.notes}</p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-semibold text-[var(--dms-primary)]">
                  Rs. {toNum(r.final_amount).toFixed(2)}
                </p>
                <p className={`font-mono text-[11px] ${profit >= 0 ? "text-[var(--dms-primary)]" : "text-[var(--dms-danger)]"}`}>
                  Profit: Rs. {profit.toFixed(2)}
                </p>
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
                {/* Summary row */}
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <DetailCell label="Total Selling" value={`Rs. ${toNum(r.total_selling_price).toFixed(2)}`} />
                  <DetailCell
                    label="Discount"
                    value={
                      toNum(r.discount_amount) > 0
                        ? `- Rs. ${toNum(r.discount_amount).toFixed(2)} ${r.discount_type === "percentage" ? `(${toNum(r.discount_value)}%)` : ""}`
                        : "None"
                    }
                  />
                  <DetailCell label="Final Amount" value={`Rs. ${toNum(r.final_amount).toFixed(2)}`} highlight />
                  <DetailCell label="Profit" value={`Rs. ${profit.toFixed(2)}`} highlight />
                </div>

                {loadingItems ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--dms-primary)] border-t-transparent" />
                  </div>
                ) : expandedItems.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--dms-text-muted)]">No items in this record.</p>
                ) : (
                  <div className="space-y-3">
                    {expandedItems.map((item) => {
                      const packs = item.inventory.units_per_pack > 0
                        ? Math.floor(item.quantity_out / item.inventory.units_per_pack)
                        : 0;
                      const itemProfit = toNum(item.line_total) - (item.quantity_out * toNum(item.purchase_price_per_unit));

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-white/[0.04] bg-[var(--dms-card-bg)] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--dms-text)]">
                                {item.inventory.item_name}
                              </p>
                              <p className="text-xs text-[var(--dms-text-muted)]">
                                {item.inventory.item_type} · {toNum(item.inventory.weight_grams)}g
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs font-bold text-[var(--dms-primary)]">
                              Rs. {toNum(item.line_total).toFixed(2)}
                            </span>
                          </div>

                          <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <DetailCell label="Qty Out" value={`${item.quantity_out} pcs (${packs} packs)`} />
                            <DetailCell label="Sell Price/pc" value={`Rs. ${toNum(item.selling_price_per_unit).toFixed(2)}`} />
                            <DetailCell label="Buy Price/pc" value={`Rs. ${toNum(item.purchase_price_per_unit).toFixed(2)}`} />
                            <DetailCell label="Profit" value={`Rs. ${itemProfit.toFixed(2)}`} highlight />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
