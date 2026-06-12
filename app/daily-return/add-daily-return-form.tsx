"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

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

export default function AddDailyReturnForm() {
    const [inventoryItems, setInventoryItems] = useState<InventoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [notes, setNotes] = useState("");
    const [entries, setEntries] = useState<Record<number, ProductEntry>>({});

    useEffect(() => {
        async function loadItems() {
            const { data } = await supabase
                .from("inventory")
                .select("item_id, item_name, item_type, weight_grams, purchase_price, selling_price, units_per_pack, stock_quantity")
                .order("item_id", { ascending: true });
            setInventoryItems((data ?? []) as InventoryOption[]);
            setLoading(false);
        }
        loadItems();
    }, []);

    const activeEntries = Object.entries(entries).filter(([, e]) => e.pieces > 0);

    const totalReturnValue = activeEntries.reduce((sum, [id, e]) => {
        const item = inventoryItems.find((i) => i.item_id === Number(id));
        if (!item) return sum;
        return sum + e.pieces * toNum(item.selling_price);
    }, 0);

    const totalPiecesReturning = activeEntries.reduce((s, [, e]) => s + e.pieces, 0);

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

        const { data: dailyReturn, error: retErr } = await supabase
            .from("daily_return")
            .insert({
                return_date: returnDate,
                total_return_value: totalReturnValue,
                notes: notes || null,
            })
            .select("return_id")
            .single();

        if (retErr || !dailyReturn) {
            toast.error("Failed to create daily return record: " + (retErr?.message ?? "Unknown error"));
            setSubmitting(false);
            return;
        }

        const returnItems = validLines.map((li) => {
            const item = inventoryItems.find((i) => i.item_id === li.item_id)!;
            return {
                return_id: dailyReturn.return_id,
                item_id: li.item_id,
                quantity_returned: li.pieces,
                selling_price_per_unit: toNum(item.selling_price),
                purchase_price_per_unit: toNum(item.purchase_price),
                line_total: li.pieces * toNum(item.selling_price),
            };
        });

        const { error: itemsErr } = await supabase.from("daily_return_items").insert(returnItems);

        if (itemsErr) {
            toast.error("Failed to save daily return items: " + itemsErr.message);
            setSubmitting(false);
            return;
        }

        // Increment stock for returned items
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

        toast.success("Daily return recorded successfully.");
        setSuccess(true);
        setEntries({});
        setNotes("");
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

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Products</p>
                    <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{inventoryItems.length}</p>
                </div>
                <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Pieces Returning</p>
                    <p className="mt-1 text-lg font-bold text-[var(--dms-text)]">{totalPiecesReturning.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-3 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">Return Value</p>
                    <p className="mt-1 text-lg font-bold text-[var(--dms-warning)]">Rs. {totalReturnValue.toFixed(2)}</p>
                </div>
            </div>

            {/* Date & Notes */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="return-date" className="block text-sm font-medium text-[var(--dms-text-secondary)]">Date</label>
                    <input id="return-date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required
                        className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30" />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="return-notes" className="block text-sm font-medium text-[var(--dms-text-secondary)]">
                        Notes <span className="text-[var(--dms-text-muted)]">(optional)</span>
                    </label>
                    <input id="return-notes" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Damaged goods return"
                        className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30" />
                </div>
            </div>

            {/* Product List with Search */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--dms-text-secondary)]">Products</p>
                    <span className="text-xs text-[var(--dms-text-muted)]">{activeEntries.length} selected</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, type, or weight..."
                        className="w-full rounded-xl border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] pl-10 pr-4 py-3 text-sm text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50 focus:ring-1 focus:ring-[var(--dms-primary)]/30" />
                </div>

                {/* All Products */}
                <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-[var(--dms-card-border)] bg-white/[0.01] p-2">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-[var(--dms-text-muted)]">No products match your search.</p>
                    ) : (
                        filtered.map((item) => {
                            const entry = entries[item.item_id] ?? { packs: 0, pieces: 0 };
                            const lineTotal = entry.pieces > 0 ? entry.pieces * toNum(item.selling_price) : 0;
                            const isActive = entry.pieces > 0;
                            return (
                                <div key={item.item_id}
                                    className={`rounded-lg border p-3 transition ${isActive ? "border-[var(--dms-warning)]/30 bg-[var(--dms-warning)]/5" : "border-[var(--dms-card-border)] bg-[var(--dms-card-bg)]"}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-[var(--dms-text)] leading-snug">
                                                {item.item_name} - {item.item_type} - {toNum(item.weight_grams)}g
                                            </p>
                                            <p className="text-[11px] text-[var(--dms-text-secondary)] mt-0.5">
                                                {item.stock_quantity} pcs in stock · Rs.{toNum(item.selling_price)}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-[var(--dms-card-border)]/50 sm:border-t-0 pt-2 sm:pt-0 mt-1.5 sm:mt-0">
                                            <div className="text-[11px] text-[var(--dms-text-muted)] flex flex-col items-start sm:items-end leading-tight">
                                                {isActive && (
                                                    <span className="font-mono font-semibold text-[var(--dms-warning)]">Rs. {lineTotal.toFixed(2)}</span>
                                                )}
                                                <span className="text-[10px]">({item.units_per_pack} pcs/pack)</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <label className="text-[10px] text-[var(--dms-text-muted)]">Pks</label>
                                                    <input type="number" min={0} value={entry.packs || ""}
                                                        onChange={(e) => updateEntry(item.item_id, "packs", Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-12 rounded-lg border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-1 py-1 text-center text-xs text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50" />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <label className="text-[10px] text-[var(--dms-text-muted)]">Pcs</label>
                                                    <input type="number" min={0} value={entry.pieces || ""}
                                                        onChange={(e) => updateEntry(item.item_id, "pieces", Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-12 rounded-lg border border-[var(--dms-input-border)] bg-[var(--dms-surface-raised)] px-1 py-1 text-center text-xs text-[var(--dms-text)] outline-none transition placeholder:text-[var(--dms-text-muted)] focus:border-[var(--dms-primary)]/50" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-card-bg)] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--dms-text-muted)]">Total Pieces Returning</span>
                    <span className="font-mono font-medium text-[var(--dms-text)]">{totalPiecesReturning}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-[var(--dms-card-border)] pt-2">
                    <span className="text-[var(--dms-text-secondary)]">Total Return Value</span>
                    <span className="font-mono text-[var(--dms-warning)]">Rs. {totalReturnValue.toFixed(2)}</span>
                </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting || activeEntries.length === 0}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-[var(--dms-warning)] text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/15 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? (
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                    </span>
                ) : (
                    "Record Daily Return"
                )}
            </button>
        </form>
    );
}