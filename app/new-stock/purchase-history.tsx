"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DetailCell from "@/app/components/detail-cell";

interface Shipment {
  shipment_id: number;
  stock_date: string;
  total_value: number | string;
  notes: string | null;
  created_at: string | null;
}

interface ShipmentItem {
  id: number;
  item_id: number;
  quantity_added: number;
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

export default function PurchaseHistory() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<ShipmentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("stock_shipments")
        .select("shipment_id, stock_date, total_value, notes, created_at")
        .order("stock_date", { ascending: false });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setShipments((data ?? []) as Shipment[]);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleExpand(shipmentId: number) {
    if (expandedId === shipmentId) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }

    setExpandedId(shipmentId);
    setLoadingItems(true);

    const { data } = await supabase
      .from("stock_shipment_items")
      .select("id, item_id, quantity_added, inventory(item_name, item_type, weight_grams, units_per_pack)")
      .eq("shipment_id", shipmentId)
      .order("id");

    setExpandedItems((data ?? []) as unknown as ShipmentItem[]);
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

  if (shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <svg className="h-6 w-6 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="mt-3 text-sm text-[var(--dms-text-muted)]">No shipments recorded yet.</p>
        <p className="mt-1 text-xs text-[var(--dms-text-muted)]">Add your first stock shipment using the &quot;Add Stock&quot; tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {shipments.map((s) => {
        const isExpanded = expandedId === s.shipment_id;

        return (
          <div
            key={s.shipment_id}
            className={`rounded-xl border transition ${
              isExpanded ? "border-[var(--dms-primary)]/20 bg-white/[0.03]" : "border-white/[0.06] bg-white/[0.015]"
            }`}
          >
            {/* Shipment header */}
            <button
              type="button"
              onClick={() => toggleExpand(s.shipment_id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--dms-primary-muted)]">
                <svg className="h-5 w-5 text-[var(--dms-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--dms-text)]">
                  {formatDate(s.stock_date)}
                </p>
                {s.notes && (
                  <p className="mt-0.5 truncate text-xs text-[var(--dms-text-muted)]">{s.notes}</p>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-semibold text-[var(--dms-primary)]">
                  ${toNum(s.total_value).toFixed(2)}
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

            {/* Expanded items */}
            {isExpanded && (
              <div className="border-t border-white/[0.06] px-4 py-3">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--dms-primary)] border-t-transparent" />
                  </div>
                ) : expandedItems.length === 0 ? (
                  <p className="py-3 text-center text-xs text-[var(--dms-text-muted)]">No items in this shipment.</p>
                ) : (
                  <div className="space-y-3">
                    {expandedItems.map((si) => {
                      const packs = si.inventory.units_per_pack > 0
                        ? Math.floor(si.quantity_added / si.inventory.units_per_pack)
                        : 0;
                      const weightG = toNum(si.inventory.weight_grams);

                      return (
                        <div
                          key={si.id}
                          className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--dms-text)]">
                                {si.inventory.item_name}
                              </p>
                              <p className="text-xs text-[var(--dms-text-muted)]">
                                {si.inventory.item_type} · {weightG}g
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[var(--dms-primary-muted)] px-2.5 py-1 text-xs font-bold text-[var(--dms-primary)]">
                              {packs} packs
                            </span>
                          </div>

                          <div className="mt-2.5 grid grid-cols-3 gap-3">
                            <DetailCell label="Pieces Added" value={String(si.quantity_added)} />
                            <DetailCell label="Pcs / Pack" value={String(si.inventory.units_per_pack)} />
                            <DetailCell label="Packs" value={String(packs)} highlight />
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
