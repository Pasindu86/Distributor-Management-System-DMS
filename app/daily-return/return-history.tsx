"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import DetailCell from "@/app/components/detail-cell";

interface DailyReturnRecord {
    return_id: number;
    return_date: string;
    total_return_value: number | string;
    notes: string | null;
    created_at: string | null;
}

interface DailyReturnItem {
    id: number;
    item_id: number;
    quantity_returned: number;
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

export default function ReturnHistory() {
    const [records, setRecords] = useState<DailyReturnRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [expandedItems, setExpandedItems] = useState<DailyReturnItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        async function load() {
            const { data, error: err } = await supabase
                .from("daily_return")
                .select("return_id, return_date, total_return_value, notes, created_at")
                .order("return_date", { ascending: false });

            if (err) {
                setError(err.message);
                setLoading(false);
                return;
            }
            setRecords((data ?? []) as DailyReturnRecord[]);
            setLoading(false);
        }
        load();
    }, []);

    async function toggleExpand(returnId: number) {
        if (expandedId === returnId) {
            setExpandedId(null);
            setExpandedItems([]);
            return;
        }

        setExpandedId(returnId);
        setLoadingItems(true);

        const { data } = await supabase
            .from("daily_return_items")
            .select("id, item_id, quantity_returned, selling_price_per_unit, purchase_price_per_unit, line_total, inventory(item_name, item_type, weight_grams, units_per_pack)")
            .eq("return_id", returnId)
            .order("id");

        setExpandedItems((data ?? []) as unknown as DailyReturnItem[]);
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                    <svg className="h-6 w-6 text-[var(--dms-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </div>
                <p className="mt-3 text-sm text-[var(--dms-text-muted)]">No daily return records yet.</p>
                <p className="mt-1 text-xs text-[var(--dms-text-muted)]">Record your first daily return using the &quot;Add Daily Return&quot; tab.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {records.map((r) => {
                const isExpanded = expandedId === r.return_id;

                return (
                    <div
                        key={r.return_id}
                        className={`rounded-xl border transition ${isExpanded ? "border-[var(--dms-warning)]/20 bg-white/[0.03]" : "border-white/[0.06] bg-white/[0.015]"
                            }`}
                    >
                        <button
                            type="button"
                            onClick={() => toggleExpand(r.return_id)}
                            className="flex w-full items-center gap-3 p-4 text-left"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--dms-warning)]/10">
                                <svg className="h-5 w-5 text-[var(--dms-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--dms-text)]">
                                    {formatDate(r.return_date)}
                                </p>
                                {r.notes && (
                                    <p className="mt-0.5 truncate text-xs text-[var(--dms-text-muted)]">{r.notes}</p>
                                )}
                            </div>

                            <div className="shrink-0 text-right">
                                <p className="font-mono text-sm font-semibold text-[var(--dms-warning)]">
                                    Rs. {toNum(r.total_return_value).toFixed(2)}
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
                            <div className="border-t border-white/[0.06] px-4 py-3">
                                {/* Summary row */}
                                <div className="mb-3 grid grid-cols-2 gap-2">
                                    <DetailCell label="Return Value" value={`Rs. ${toNum(r.total_return_value).toFixed(2)}`} highlight />
                                    <DetailCell label="Date" value={formatDate(r.return_date)} />
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
                                                ? Math.floor(item.quantity_returned / item.inventory.units_per_pack)
                                                : 0;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
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
                                                        <span className="shrink-0 font-mono text-xs font-bold text-[var(--dms-warning)]">
                                                            Rs. {toNum(item.line_total).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                        <DetailCell label="Qty Returned" value={`${item.quantity_returned} pcs (${packs} packs)`} />
                                                        <DetailCell label="Sell Price/pc" value={`Rs. ${toNum(item.selling_price_per_unit).toFixed(2)}`} />
                                                        <DetailCell label="Buy Price/pc" value={`Rs. ${toNum(item.purchase_price_per_unit).toFixed(2)}`} />
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