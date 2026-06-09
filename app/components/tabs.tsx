"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div>
      {/* Tab header */}
      <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[var(--dms-primary)] text-slate-950 shadow-sm"
                : "text-[var(--dms-text-secondary)] hover:bg-white/5 hover:text-[var(--dms-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
}
