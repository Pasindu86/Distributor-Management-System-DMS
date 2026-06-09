"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface InventoryOption {
  item_id: number;
  item_name: string;
  item_type: string;
  weight_grams: number | string;
  purchase_price: number | string;
  units_per_pack: number;
  stock_quantity: number;
}

interface LineItem {
  item_id: number;
  quantity: number;
}

function toNum(v: number | string) {
  return typeof v === "number" ? v : Number(v);
}

export default function AddStockForm() {
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [stockDate, setStockDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ item_id: 0, quantity: 0 }]);
  const [manualTotal, setManualTotal] = useState<string>("");

  useEffect(() => {
    async function loadItems() {
      const { data } = await supabase
        .from("inventory")
        .select("item_id, item_name, item_type, weight_grams, purchase_price, units_per_pack, stock_quantity")
        .order("item_name");
      setInventoryItems((data ?? []) as InventoryOption[]);
      setLoading(false);
    }
    loadItems();
  }, []);

  const calculatedTotal = lineItems.reduce((sum, li) => {
    const item = inventoryItems.find((i) => i.item_id === li.item_id);
    if (!item || li.quantity <= 0) return sum;
    return sum + li.quantity * toNum(item.purchase_price);
  }, 0);

  const totalValue = manualTotal !== "" ? Number(manualTotal) : calculatedTotal;
  const totalPiecesAdding = lineItems.reduce((s, li) => s + (li.quantity > 0 ? li.quantity : 0), 0);
  const totalCurrentStock = inventoryItems.reduce((s, i) => s + i.stock_quantity, 0);
  const totalPacks = inventoryItems.reduce((s, i) => s + (i.units_per_pack > 0 ? Math.floor(i.stock_quantity / i.units_per_pack) : 0), 0);

  function addLine() {
    setLineItems([...lineItems, { item_id: 0, quantity: 0 }]);
  }

  function removeLine(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof LineItem, value: number) {
    setLineItems(lineItems.map((li, i) => (i === index ? { ...li, [field]: value } : li)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = lineItems.filter((li) => li.item_id > 0 && li.quantity > 0);
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
      quantity_added: li.quantity,
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
        p_quantity: li.quantity,
      }).maybeSingle();

      if (updateErr) {
        await supabase
          .from("inventory")
          .update({ stock_quantity: li.quantity })
          .eq("item_id", li.item_id);
      }
    }

    setSuccess(true);
    setLineItems([{ item_id: 0, quantity: 0 }]);
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
          Stock shipment recorded successfully. Inventory updated.
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
          <p className="mt-1 text-lg font-bold text-[var(--dms-primary)]">${totalValue.toFixed(2)}</p>
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

      {/* Line Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--dms-text-secondary)]">Products</p>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--dms-text-secondary)] transition hover:bg-white/10 hover:text-[var(--dms-text)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        <div className="space-y-2">
          {lineItems.map((li, index) => (
            <LineItemRow
              key={index}
              lineItem={li}
              index={index}
              inventoryItems={inventoryItems}
              onUpdate={updateLine}
              onRemove={removeLine}
              showRemove={lineItems.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Total Value */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--dms-text-secondary)]">Total Value</p>
            <p className="mt-0.5 text-xs text-[var(--dms-text-muted)]">
              Auto: ${calculatedTotal.toFixed(2)} — override if different
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
        disabled={submitting || lineItems.every((li) => li.item_id === 0 || li.quantity <= 0)}
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
          "Record Shipment"
        )}
      </button>
    </form>
  );
}

function LineItemRow({
  lineItem,
  index,
  inventoryItems,
  onUpdate,
  onRemove,
  showRemove,
}: {
  lineItem: LineItem;
  index: number;
  inventoryItems: InventoryOption[];
  onUpdate: (index: number, field: keyof LineItem, value: number) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedItem = inventoryItems.find((i) => i.item_id === lineItem.item_id);

  const filtered = inventoryItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.item_name.toLowerCase().includes(q) ||
      item.item_type.toLowerCase().includes(q) ||
      String(toNum(item.weight_grams)).includes(q)
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectItem(itemId: number) {
    onUpdate(index, "item_id", itemId);
    setSearchQuery("");
    setIsOpen(false);
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      {/* Searchable product picker */}
      <div className="relative flex-1 min-w-0" ref={wrapperRef}>
        <div
          className="flex w-full cursor-pointer items-center rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-3 py-2.5"
          onClick={() => setIsOpen(true)}
        >
          {selectedItem ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--dms-text)]">{selectedItem.item_name}</p>
              <p className="text-[11px] text-[var(--dms-text-muted)]">
                {selectedItem.item_type} · {toNum(selectedItem.weight_grams)}g
              </p>
            </div>
          ) : (
            <span className="text-sm text-[var(--dms-text-muted)]">Search product...</span>
          )}
          <svg className="ml-2 h-4 w-4 shrink-0 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-hidden rounded-xl border border-white/[0.1] bg-[var(--dms-surface)] shadow-xl shadow-black/30">
            <div className="border-b border-white/[0.06] p-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, type, or weight..."
                autoFocus
                className="w-full rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-3 py-2 text-sm text-[var(--dms-text)] outline-none placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--dms-text-muted)]">No products match your search.</p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.item_id}
                    type="button"
                    onClick={() => selectItem(item.item_id)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5 ${
                      item.item_id === lineItem.item_id ? "bg-[var(--dms-primary-muted)]" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--dms-text)]">{item.item_name}</p>
                      <p className="text-[11px] text-[var(--dms-text-muted)]">
                        {item.item_type} · {toNum(item.weight_grams)}g · {item.stock_quantity} pcs in stock
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="w-20 shrink-0 sm:w-24">
        <input
          type="number"
          min={1}
          value={lineItem.quantity || ""}
          onChange={(e) => onUpdate(index, "quantity", Number(e.target.value))}
          placeholder="Qty"
          className="w-full rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-3 py-2.5 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50"
        />
      </div>

      {/* Remove */}
      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-[var(--dms-text-muted)] transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-[var(--dms-danger)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
