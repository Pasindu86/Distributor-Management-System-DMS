"use client";

import Sidebar from "../components/sidebar";
import Tabs from "../components/tabs";
import AddDailyReturnForm from "./add-daily-return-form";
import ReturnHistory from "./return-history";
import RouteGuard from "../components/route-guard";

export default function DailyReturnPage() {
    const tabs = [
        {
            id: "add",
            label: "New",
            content: <AddDailyReturnForm />,
        },
        {
            id: "history",
            label: "History",
            content: <ReturnHistory />,
        },
    ];

    return (
        <RouteGuard requireAdmin>
        <div className="min-h-screen bg-[var(--dms-bg)]">
            <Sidebar />

            <main className="pt-[60px] lg:pt-0 lg:pl-[var(--dms-sidebar-width)]">
                <div className="p-3 sm:p-4 lg:p-6">
                    <div className="mb-5">
                        <h1 className="text-2xl font-bold text-[var(--dms-text)]">Daily Return</h1>
                    </div>

                    <Tabs tabs={tabs} defaultTab="add" />
                </div>
            </main>
        </div>
        </RouteGuard>
    );
}