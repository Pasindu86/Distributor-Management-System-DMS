"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface InventoryOption {
  item_id: number;
  item_name: string;
  item_type: string;
  weight_grams: number | string;
  purchase_price: number | string;
  selling_price: number | string;
  units_per_pack: number;
  stock_quantity: number;
}

interface ProductEntry {
  packs: number;
  pieces: number;
}

function toNum(v: number | string) {
  return typeof v === "number" ? v : Number(v);
}

export default function AddStockForm() {
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [stockDate, setStockDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<Record<number, ProductEntry>>({});
  const [manualTotal, setManualTotal] = useState<string>("");

  useEffect(() => {
    async function loadItems() {
      const { data } = await supabase
        .from("inventory")
        .select("item_id, item_name, item_type, weight_grams, purchase_price, selling_price, units_per_pack, stock_quantity")
        .order("item_name");
      setInventoryItems((data ?? []) as InventoryOption[]);
      setLoading(false);
    }
    loadItems();
  }, []);

  const activeEntries = Object.entries(entries).filter(([, e]) => e.pieces > 0);

  const calculatedTotal = activeEntries.reduce((sum, [id, e]) => {
    const item = inventoryItems.find((i) => i.item_id === Number(id));
    if (!item) return sum;
    return sum + e.pieces * toNum(item.purchase_price);
  }, 0);

  const totalValue = manualTotal !== "" ? Number(manualTotal) : calculatedTotal;
  const totalPiecesAdding = activeEntries.reduce((s, [, e]) => s + e.pieces, 0);
  const totalCurrentStock = inventoryItems.reduce((s, i) => s + i.stock_quantity, 0);
  const totalPacks = inventoryItems.reduce((s, i) => s + (i.units_per_pack > 0 ? Math.floor(i.stock_quantity / i.units_per_pack) : 0), 0);

  function updateEntry(itemId: number, field: "packs" | "pieces", value: number) {
    const item = inventoryItems.find((i) => i.item_id === itemId);
    const unitsPerPack = item?.units_per_pack ?? 1;
    setEntries((prev) => {
      if (field === "packs") {
        return { ...prev, [itemId]: { packs: value, pieces: value * unitsPerPack } };
      }
      return { ...prev, [itemId]: { pieces: value, packs: unitsPerPack > 0 ? Math.floor(value / unitsPerPack) : 0 } };
    });
  }

  const filtered = inventoryItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.item_name.toLowerCase().includes(q) ||
      item.item_type.toLowerCase().includes(q) ||
      String(toNum(item.weight_grams)).includes(q)
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = activeEntries.map(([id, en]) => ({ item_id: Number(id), pieces: en.pieces }));
    if (validLines.length === 0) return;

    setSubmitting(true);
    setSuccess(false);

    const { data: shipment, error: shipErr } = await supabase
      .from("stock_shipments")
      .insert({ stock_date: stockDate, total_value: totalValue, notes: notes || null })
      .select("shipment_id")
      .single();

    if (shipErr || !shipment) {
      alert("Failed to create shipment: " + (shipErr?.message ?? "Unknown error"));
      setSubmitting(false);
      return;
    }

    const shipmentItems = validLines.map((li) => ({
      shipment_id: shipment.shipment_id,
      item_id: li.item_id,
      quantity_added: li.pieces,
    }));

    const { error: itemsErr } = await supabase.from("stock_shipment_items").insert(shipmentItems);

    if (itemsErr) {
      alert("Failed to save shipment items: " + itemsErr.message);
      setSubmitting(false);
      return;
    }

    for (const li of validLines) {
      const { error: updateErr } = await supabase.rpc("increment_stock", {
        p_item_id: li.item_id,
        p_quantity: li.pieces,
      }).maybeSingle();

      if (updateErr) {
        const item = inventoryItems.find((i) => i.item_id === li.item_id);
        if (item) {
          await supabase
            .from("inventory")
            .update({ stock_quantity: item.stock_quantity + li.pieces })
            .eq("item_id", li.item_id);
        }
      }
    }

    setSuccess(true);
    setEntries({});
    setNotes("");
    setManualTotal("");
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-sm text-[var(--dms-text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--dms-primary)] border-t-transparent" />
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="rounded-xl border border-[var(--dms-primary)]/20 bg-[var(--dms-primary-muted)] px-4 py-3 text-sm font-medium text-[var(--dms-primary)]">
          Saved successfully.
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Current Stock</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{totalCurrentStock.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Total Packs</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-primary)]">{totalPacks.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Adding Now</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{totalPiecesAdding.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Shipment Value</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-primary)]">Rs. {totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Date & Notes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="stock-date" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
            Stock Date
          </label>
          <input
            id="stock-date"
            type="date"
            value={stockDate}
            onChange={(e) => setStockDate(e.target.value)}
            required
            className="w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="notes" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
            Notes <span className="text-[var(--dms-text-muted)]">(optional)</span>
          </label>
          <input
            id="notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Supplier invoice #123"
            className="w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
          />
        </div>
      </div>

      {/* Product List with Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--dms-text-secondary)]">Items</p>
          <span className="text-xs text-[var(--dms-text-muted)]">{activeEntries.length} selected</span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, type, or weight..."
            className="w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] pl-10 pr-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30" />
        </div>

        {/* All Products */}
        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.01] p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-[var(--dms-text-muted)]">No products match your search.</p>
          ) : (
            filtered.map((item) => {
              const entry = entries[item.item_id] ?? { packs: 0, pieces: 0 };
              const lineTotal = entry.pieces > 0 ? entry.pieces * toNum(item.purchase_price) : 0;
              const isActive = entry.pieces > 0;
              return (
                <div key={item.item_id}
                  className={`rounded-lg border p-3 transition ${isActive ? "border-[var(--dms-primary)]/30 bg-[var(--dms-primary)]/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--dms-text)]">{item.item_name}</p>
                      <p className="text-[11px] text-[var(--dms-text-muted)]">
                        {item.item_type} · {toNum(item.weight_grams)}g · {item.stock_quantity} pcs in stock · Rs.{toNum(item.purchase_price)} ea
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-[var(--dms-text-muted)]">Pks</label>
                        <input type="number" min={0} value={entry.packs || ""}
                          onChange={(e) => updateEntry(item.item_id, "packs", Number(e.target.value))}
                          placeholder="0"
                          className="w-14 rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-2 py-1.5 text-center text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-[var(--dms-text-muted)]">Pcs</label>
                        <input type="number" min={0} value={entry.pieces || ""}
                          onChange={(e) => updateEntry(item.item_id, "pieces", Number(e.target.value))}
                          placeholder="0"
                          className="w-14 rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-2 py-1.5 text-center text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50" />
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px]">
                      <span className="text-[var(--dms-text-muted)]">({item.units_per_pack} pcs/pack)</span>
                      <span className="font-mono font-semibold text-[var(--dms-primary)]">Rs. {lineTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Total Value */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--dms-text-secondary)]">Total Value</p>
            <p className="mt-0.5 text-xs text-[var(--dms-text-muted)]">
              Auto: Rs. {calculatedTotal.toFixed(2)} — override if needed
            </p>
          </div>
          <input
            type="number"
            step="0.01"
            min={0}
            value={manualTotal}
            onChange={(e) => setManualTotal(e.target.value)}
            placeholder={calculatedTotal.toFixed(2)}
            className="w-full rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-3 py-2.5 text-right text-sm font-mono font-semibold text-[var(--dms-primary)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 sm:w-36"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || activeEntries.length === 0}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-[var(--dms-primary)] text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/15 transition hover:bg-[var(--dms-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : (
          "Save"
        )}
      </button>
    </form>
  );
}
