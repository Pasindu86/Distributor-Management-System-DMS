"use client";

import { useEffect, useRef, useState } from "react";
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

interface LineItem {
  item_id: number;
  packs: number;
  pieces: number;
}

function toNum(v: number | string) {
  return typeof v === "number" ? v : Number(v);
}

export default function AddDailyOutForm() {
  const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [outDate, setOutDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ item_id: 0, packs: 0, pieces: 0 }]);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState<string>("");

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

  const totalSellingPrice = lineItems.reduce((sum, li) => {
    const item = inventoryItems.find((i) => i.item_id === li.item_id);
    if (!item || li.pieces <= 0) return sum;
    return sum + li.pieces * toNum(item.selling_price);
  }, 0);

  const totalBuyingCost = lineItems.reduce((sum, li) => {
    const item = inventoryItems.find((i) => i.item_id === li.item_id);
    if (!item || li.pieces <= 0) return sum;
    return sum + li.pieces * toNum(item.purchase_price);
  }, 0);

  const discountAmount =
    discountType === "fixed"
      ? Number(discountValue) || 0
      : (totalSellingPrice * (Number(discountValue) || 0)) / 100;

  const finalAmount = totalSellingPrice - discountAmount;
  const totalProfit = finalAmount - totalBuyingCost;
  const totalPiecesAdding = lineItems.reduce((s, li) => s + (li.pieces > 0 ? li.pieces : 0), 0);

  function addLine() {
    setLineItems([...lineItems, { item_id: 0, packs: 0, pieces: 0 }]);
  }

  function removeLine(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof LineItem, value: number) {
    setLineItems(
      lineItems.map((li, i) => {
        if (i !== index) return li;
        const item = inventoryItems.find((inv) => inv.item_id === (field === "item_id" ? value : li.item_id));
        const unitsPerPack = item?.units_per_pack ?? 1;

        if (field === "packs") {
          return { ...li, packs: value, pieces: value * unitsPerPack };
        }
        if (field === "pieces") {
          return { ...li, pieces: value, packs: unitsPerPack > 0 ? Math.floor(value / unitsPerPack) : 0 };
        }
        return { ...li, [field]: value, packs: 0, pieces: 0 };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = lineItems.filter((li) => li.item_id > 0 && li.pieces > 0);
    if (validLines.length === 0) return;

    setSubmitting(true);
    setSuccess(false);

    const { data: dailyOut, error: outErr } = await supabase
      .from("daily_out")
      .insert({
        out_date: outDate,
        total_selling_price: totalSellingPrice,
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        total_profit: totalProfit,
        notes: notes || null,
      })
      .select("out_id")
      .single();

    if (outErr || !dailyOut) {
      alert("Failed to create daily out record: " + (outErr?.message ?? "Unknown error"));
      setSubmitting(false);
      return;
    }

    const outItems = validLines.map((li) => {
      const item = inventoryItems.find((i) => i.item_id === li.item_id)!;
      return {
        out_id: dailyOut.out_id,
        item_id: li.item_id,
        quantity_out: li.pieces,
        selling_price_per_unit: toNum(item.selling_price),
        purchase_price_per_unit: toNum(item.purchase_price),
        line_total: li.pieces * toNum(item.selling_price),
      };
    });

    const { error: itemsErr } = await supabase.from("daily_out_items").insert(outItems);

    if (itemsErr) {
      alert("Failed to save daily out items: " + itemsErr.message);
      setSubmitting(false);
      return;
    }

    for (const li of validLines) {
      const { error: updateErr } = await supabase.rpc("decrement_stock", {
        p_item_id: li.item_id,
        p_quantity: li.pieces,
      }).maybeSingle();

      if (updateErr) {
        const item = inventoryItems.find((i) => i.item_id === li.item_id);
        if (item) {
          await supabase
            .from("inventory")
            .update({ stock_quantity: item.stock_quantity - li.pieces })
            .eq("item_id", li.item_id);
        }
      }
    }

    setSuccess(true);
    setLineItems([{ item_id: 0, packs: 0, pieces: 0 }]);
    setNotes("");
    setDiscountValue("");
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
          Daily out recorded successfully. Stock updated.
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Products</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{inventoryItems.length}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Pieces Out</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{totalPiecesAdding.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Total Selling</p>
          <p className="mt-1 text-lg font-bold text-[var(--dms-primary)]">Rs. {totalSellingPrice.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Profit</p>
          <p className={`mt-1 text-lg font-bold ${totalProfit >= 0 ? "text-[var(--dms-primary)]" : "text-[var(--dms-danger)]"}`}>
            Rs. {totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Date & Notes */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="out-date" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
            Date
          </label>
          <input
            id="out-date"
            type="date"
            value={outDate}
            onChange={(e) => setOutDate(e.target.value)}
            required
            className="w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="out-notes" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
            Notes <span className="text-[var(--dms-text-muted)]">(optional)</span>
          </label>
          <input
            id="out-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Route A delivery"
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

      {/* Discount & Summary */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-medium text-[var(--dms-text-secondary)]">Discount</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  discountType === "fixed"
                    ? "bg-[var(--dms-primary)] text-slate-950"
                    : "border border-white/[0.08] bg-white/5 text-[var(--dms-text-secondary)] hover:bg-white/10"
                }`}
              >
                Fixed (Rs.)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  discountType === "percentage"
                    ? "bg-[var(--dms-primary)] text-slate-950"
                    : "border border-white/[0.08] bg-white/5 text-[var(--dms-text-secondary)] hover:bg-white/10"
                }`}
              >
                Percentage (%)
              </button>
            </div>
          </div>
          <div className="w-full sm:w-36">
            <input
              type="number"
              step="0.01"
              min={0}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "fixed" ? "0.00" : "0"}
              className="w-full rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-3 py-2.5 text-right text-sm font-mono font-semibold text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50"
            />
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--dms-text-muted)]">Total Selling Price</span>
            <span className="font-mono font-medium text-[var(--dms-text)]">Rs. {totalSellingPrice.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--dms-text-muted)]">
                Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
              </span>
              <span className="font-mono font-medium text-[var(--dms-danger)]">- Rs. {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-[var(--dms-text-secondary)]">Final Amount</span>
            <span className="font-mono text-[var(--dms-primary)]">Rs. {finalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--dms-text-muted)]">Total Buying Cost</span>
            <span className="font-mono font-medium text-[var(--dms-text)]">Rs. {totalBuyingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t border-white/[0.06] pt-2">
            <span className="text-[var(--dms-text-secondary)]">Profit</span>
            <span className={`font-mono ${totalProfit >= 0 ? "text-[var(--dms-primary)]" : "text-[var(--dms-danger)]"}`}>
              Rs. {totalProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || lineItems.every((li) => li.item_id === 0 || li.pieces <= 0)}
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
          "Record Daily Out"
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
  const lineTotal = selectedItem && lineItem.pieces > 0
    ? lineItem.pieces * toNum(selectedItem.selling_price)
    : 0;

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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
      <div className="flex items-start gap-2">
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
                  {selectedItem.item_type} · {toNum(selectedItem.weight_grams)}g · {selectedItem.stock_quantity} pcs in stock
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
                          {item.item_type} · {toNum(item.weight_grams)}g · {item.stock_quantity} pcs
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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

      {/* Packs & Pieces row */}
      {selectedItem && (
        <div className="flex items-center gap-2 pl-0.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-[var(--dms-text-muted)]">Packs</label>
            <input
              type="number"
              min={0}
              value={lineItem.packs || ""}
              onChange={(e) => onUpdate(index, "packs", Number(e.target.value))}
              placeholder="0"
              className="w-16 rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-2 py-1.5 text-center text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50"
            />
          </div>
          <span className="text-xs text-[var(--dms-text-muted)]">=</span>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-[var(--dms-text-muted)]">Pieces</label>
            <input
              type="number"
              min={0}
              value={lineItem.pieces || ""}
              onChange={(e) => onUpdate(index, "pieces", Number(e.target.value))}
              placeholder="0"
              className="w-16 rounded-lg border border-white/[0.08] bg-[var(--dms-surface-raised)] px-2 py-1.5 text-center text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50"
            />
          </div>
          <span className="text-[11px] text-[var(--dms-text-muted)]">
            ({selectedItem.units_per_pack} pcs/pack)
          </span>
          {lineTotal > 0 && (
            <span className="ml-auto font-mono text-xs font-semibold text-[var(--dms-primary)]">
              Rs. {lineTotal.toFixed(2)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
