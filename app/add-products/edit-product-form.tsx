"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

interface InventoryItem {
  item_id: number;
  item_name: string;
  item_type: string;
  weight_grams: number | string;
  purchase_price: number | string;
  selling_price: number | string;
  units_per_pack: number;
  stock_quantity: number;
}

interface EditFormData {
  item_name: string;
  item_type: string;
  weight_grams: string;
  purchase_price: string;
  selling_price: string;
  units_per_pack: string;
}

function toNum(v: number | string) {
  return typeof v === "number" ? v : Number(v);
}

export default function EditProductForm() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<EditFormData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    const { data } = await supabase
      .from("inventory")
      .select("item_id, item_name, item_type, weight_grams, purchase_price, selling_price, units_per_pack, stock_quantity")
      .order("item_name", { ascending: true });
    setItems((data ?? []) as InventoryItem[]);
    setLoading(false);
  }

  const filtered = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.item_name.toLowerCase().includes(q) ||
      item.item_type.toLowerCase().includes(q) ||
      String(toNum(item.weight_grams)).includes(q)
    );
  });

  function selectItem(item: InventoryItem) {
    setSelectedItem(item);
    setShowDeleteConfirm(false);
    setForm({
      item_name: item.item_name,
      item_type: item.item_type,
      weight_grams: String(toNum(item.weight_grams)),
      purchase_price: String(toNum(item.purchase_price)),
      selling_price: String(toNum(item.selling_price)),
      units_per_pack: String(item.units_per_pack),
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }

  function updateField(field: keyof EditFormData, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function hasChanges(): boolean {
    if (!selectedItem || !form) return false;
    return (
      form.item_name !== selectedItem.item_name ||
      form.item_type !== selectedItem.item_type ||
      form.weight_grams !== String(toNum(selectedItem.weight_grams)) ||
      form.purchase_price !== String(toNum(selectedItem.purchase_price)) ||
      form.selling_price !== String(toNum(selectedItem.selling_price)) ||
      form.units_per_pack !== String(selectedItem.units_per_pack)
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || !form) return;

    setSubmitting(true);

    const { error } = await supabase
      .from("inventory")
      .update({
        item_name: form.item_name.trim(),
        item_type: form.item_type.trim(),
        weight_grams: Number(form.weight_grams),
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        units_per_pack: Number(form.units_per_pack),
      })
      .eq("item_id", selectedItem.item_id);

    if (error) {
      toast.error("Failed to update: " + error.message);
      setSubmitting(false);
      return;
    }

    toast.success(`${form.item_name} updated successfully!`);

    // Refresh the list
    const updatedItem: InventoryItem = {
      ...selectedItem,
      item_name: form.item_name.trim(),
      item_type: form.item_type.trim(),
      weight_grams: Number(form.weight_grams),
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      units_per_pack: Number(form.units_per_pack),
    };

    setItems((prev) =>
      prev.map((i) => (i.item_id === selectedItem.item_id ? updatedItem : i))
    );
    setSelectedItem(updatedItem);
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!selectedItem) return;

    setDeleting(true);

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("item_id", selectedItem.item_id);

    if (error) {
      toast.error("Failed to delete: " + error.message);
      setDeleting(false);
      return;
    }

    toast.success(`${selectedItem.item_name} deleted.`);
    setItems((prev) => prev.filter((i) => i.item_id !== selectedItem.item_id));
    setSelectedItem(null);
    setForm(null);
    setShowDeleteConfirm(false);
    setDeleting(false);
  }

  const profit = form
    ? (Number(form.selling_price) || 0) - (Number(form.purchase_price) || 0)
    : 0;

  const inputClass =
    "w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30";

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
    <div className="space-y-5">

      {/* Search & Product List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--dms-text-secondary)]">
            Select a product to edit
          </p>
          <span className="text-xs text-[var(--dms-text-muted)]">{items.length} products</span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, type, or weight..."
            className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] pl-10 pr-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30"
          />
        </div>

        {/* Product list */}
        <div className="max-h-[320px] space-y-1.5 overflow-y-auto rounded-xl border border-[var(--dms-card-border)] bg-white/[0.01] p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-[var(--dms-text-muted)]">No products match your search.</p>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedItem?.item_id === item.item_id;
              return (
                <button
                  key={item.item_id}
                  type="button"
                  onClick={() => selectItem(item)}
                  className={`w-full text-left rounded-lg border p-3 transition cursor-pointer ${
                    isSelected
                      ? "border-[var(--dms-primary)]/30 bg-[var(--dms-primary)]/5 ring-1 ring-[var(--dms-primary)]/10"
                      : "border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] hover:bg-[var(--dms-hover-bg)]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--dms-text)] leading-snug">
                        {item.item_name}
                      </p>
                      <p className="text-[11px] text-[var(--dms-text-secondary)] mt-0.5">
                        {item.item_type} · {toNum(item.weight_grams)}g · {item.units_per_pack} pcs/pack
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--dms-text-muted)] shrink-0">
                      <span>Buy: Rs.{toNum(item.purchase_price)}</span>
                      <span>Sell: Rs.{toNum(item.selling_price)}</span>
                      <span className="font-medium text-[var(--dms-text-secondary)]">{item.stock_quantity} pcs</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Form */}
      {selectedItem && form && (
        <div ref={formRef}>
          <form onSubmit={handleSave} className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--dms-text)]">
                  Editing: {selectedItem.item_name}
                </p>
                <p className="text-[11px] text-[var(--dms-text-muted)] mt-0.5">
                  ID #{selectedItem.item_id} · {selectedItem.stock_quantity} pcs in stock (not editable here)
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedItem(null); setForm(null); setShowDeleteConfirm(false); }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--dms-text-muted)] hover:bg-[var(--dms-hover-bg)] hover:text-[var(--dms-text)] transition"
              >
                Cancel
              </button>
            </div>

            {/* Product Info */}
            <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 space-y-4">
              <p className="text-sm font-semibold text-[var(--dms-text-secondary)]">Product Information</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                    Product Name <span className="text-[var(--dms-danger)]">*</span>
                  </label>
                  <input id="edit-name" type="text" required value={form.item_name}
                    onChange={(e) => updateField("item_name", e.target.value)}
                    placeholder="e.g. Chocolate Biscuit" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-type" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                    Type / Category <span className="text-[var(--dms-danger)]">*</span>
                  </label>
                  <input id="edit-type" type="text" required value={form.item_type}
                    onChange={(e) => updateField("item_type", e.target.value)}
                    placeholder="e.g. Biscuit, Snack, Drink" className={inputClass} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="edit-weight" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                    Weight (grams) <span className="text-[var(--dms-danger)]">*</span>
                  </label>
                  <input id="edit-weight" type="number" required min={0} step="0.01" value={form.weight_grams}
                    onChange={(e) => updateField("weight_grams", e.target.value)}
                    placeholder="0.00" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-units" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                    Units Per Pack <span className="text-[var(--dms-danger)]">*</span>
                  </label>
                  <input id="edit-units" type="number" required min={1} value={form.units_per_pack}
                    onChange={(e) => updateField("units_per_pack", e.target.value)}
                    placeholder="e.g. 24" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 space-y-4">
              <p className="text-sm font-semibold text-[var(--dms-text-secondary)]">Pricing</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="edit-buy" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                    Purchase Price (Rs.) <span className="text-[var(--dms-danger)]">*</span>
                  </label>
                  <input id="edit-buy" type="number" required min={0} step="0.01" value={form.purchase_price}
                    onChange={(e) => updateField("purchase_price", e.target.value)}
                    placeholder="0.00" className={inputClass} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-sell" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                    Selling Price (Rs.) <span className="text-[var(--dms-danger)]">*</span>
                  </label>
                  <input id="edit-sell" type="number" required min={0} step="0.01" value={form.selling_price}
                    onChange={(e) => updateField("selling_price", e.target.value)}
                    placeholder="0.00" className={inputClass} />
                </div>
              </div>

              {/* Profit preview */}
              {(Number(form.purchase_price) > 0 || Number(form.selling_price) > 0) && (
                <div className="flex items-center justify-between rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] px-4 py-2.5">
                  <span className="text-xs font-medium text-[var(--dms-text-muted)]">Profit per unit</span>
                  <span className={`font-mono text-sm font-bold ${profit >= 0 ? "text-[var(--dms-primary)]" : "text-[var(--dms-danger)]"}`}>
                    Rs. {profit.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Delete */}
              <div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-xl px-4 py-2.5 text-xs font-medium text-[var(--dms-danger)] border border-[var(--dms-danger)]/20 hover:bg-[var(--dms-danger)]/10 transition"
                  >
                    Delete Product
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--dms-danger)]">Are you sure?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-[var(--dms-danger)] text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--dms-text-muted)] hover:bg-[var(--dms-hover-bg)] transition"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={submitting || !hasChanges()}
                className="flex h-11 w-full sm:w-auto items-center justify-center rounded-xl bg-[var(--dms-primary)] px-8 text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/15 transition hover:bg-[var(--dms-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
