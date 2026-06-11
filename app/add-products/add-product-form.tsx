"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface ProductFormData {
  item_name: string;
  item_type: string;
  weight_grams: string;
  purchase_price: string;
  selling_price: string;
  units_per_pack: string;
  stock_quantity: string;
}

const emptyForm: ProductFormData = {
  item_name: "",
  item_type: "",
  weight_grams: "",
  purchase_price: "",
  selling_price: "",
  units_per_pack: "",
  stock_quantity: "0",
};

export default function AddProductForm() {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof ProductFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const profit = (Number(form.selling_price) || 0) - (Number(form.purchase_price) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    setError(null);

    const { error: insertErr } = await supabase.from("inventory").insert({
      item_name: form.item_name.trim(),
      item_type: form.item_type.trim(),
      weight_grams: Number(form.weight_grams),
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      units_per_pack: Number(form.units_per_pack),
      stock_quantity: Number(form.stock_quantity) || 0,
    });

    if (insertErr) {
      setError(insertErr.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setForm(emptyForm);
    setSubmitting(false);
  }

  const inputClass =
    "w-full rounded-xl border border-white/[0.08] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {success && (
        <div className="rounded-xl border border-[var(--dms-primary)]/20 bg-[var(--dms-primary-muted)] px-4 py-3 text-sm font-medium text-[var(--dms-primary)]">
          Product added successfully!
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-[var(--dms-danger)]/20 bg-[var(--dms-danger-muted)] px-4 py-3 text-sm font-medium text-[var(--dms-danger)]">
          {error}
        </div>
      )}

      {/* Product Info */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
        <p className="text-sm font-semibold text-[var(--dms-text-secondary)]">Product Information</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="item-name" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Product Name <span className="text-[var(--dms-danger)]">*</span>
            </label>
            <input id="item-name" type="text" required value={form.item_name}
              onChange={(e) => update("item_name", e.target.value)}
              placeholder="e.g. Chocolate Biscuit" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="item-type" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Type / Category <span className="text-[var(--dms-danger)]">*</span>
            </label>
            <input id="item-type" type="text" required value={form.item_type}
              onChange={(e) => update("item_type", e.target.value)}
              placeholder="e.g. Biscuit, Snack, Drink" className={inputClass} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="weight" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Weight (grams) <span className="text-[var(--dms-danger)]">*</span>
            </label>
            <input id="weight" type="number" required min={0} step="0.01" value={form.weight_grams}
              onChange={(e) => update("weight_grams", e.target.value)}
              placeholder="0.00" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="units-pack" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Units Per Pack <span className="text-[var(--dms-danger)]">*</span>
            </label>
            <input id="units-pack" type="number" required min={1} value={form.units_per_pack}
              onChange={(e) => update("units_per_pack", e.target.value)}
              placeholder="e.g. 24" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stock-qty" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Initial Stock <span className="text-[var(--dms-text-muted)]">(pcs)</span>
            </label>
            <input id="stock-qty" type="number" min={0} value={form.stock_quantity}
              onChange={(e) => update("stock_quantity", e.target.value)}
              placeholder="0" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
        <p className="text-sm font-semibold text-[var(--dms-text-secondary)]">Pricing</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="buy-price" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Purchase Price (Rs.) <span className="text-[var(--dms-danger)]">*</span>
            </label>
            <input id="buy-price" type="number" required min={0} step="0.01" value={form.purchase_price}
              onChange={(e) => update("purchase_price", e.target.value)}
              placeholder="0.00" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sell-price" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
              Selling Price (Rs.) <span className="text-[var(--dms-danger)]">*</span>
            </label>
            <input id="sell-price" type="number" required min={0} step="0.01" value={form.selling_price}
              onChange={(e) => update("selling_price", e.target.value)}
              placeholder="0.00" className={inputClass} />
          </div>
        </div>

        {/* Profit preview */}
        {(Number(form.purchase_price) > 0 || Number(form.selling_price) > 0) && (
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
            <span className="text-xs font-medium text-[var(--dms-text-muted)]">Profit per unit</span>
            <span className={`font-mono text-sm font-bold ${profit >= 0 ? "text-[var(--dms-primary)]" : "text-[var(--dms-danger)]"}`}>
              Rs. {profit.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Submit */}
      <button type="submit" disabled={submitting}
        className="flex h-11 w-full items-center justify-center rounded-xl bg-[var(--dms-primary)] text-sm font-semibold text-slate-950 shadow-md shadow-emerald-500/15 transition hover:bg-[var(--dms-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </span>
        ) : (
          "Save"
        )}
      </button>
    </form>
  );
}
