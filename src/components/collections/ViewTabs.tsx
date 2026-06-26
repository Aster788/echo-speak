"use client";

import Image from "next/image";

export type CollectionsViewTab = "topic" | "video" | "all";

const TABS: Array<{ id: CollectionsViewTab; label: string }> = [
  { id: "topic", label: "Topic" },
  { id: "video", label: "Video" },
  { id: "all", label: "All" },
];

type ViewTabsProps = {
  active: CollectionsViewTab;
  onChange: (tab: CollectionsViewTab) => void;
};

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    <div className="flex items-stretch justify-center gap-3">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-w-0 flex-1 items-center justify-center py-0.5 transition-transform duration-150 ${
              isActive
                ? "z-10 -translate-y-0.5 drop-shadow-[0_8px_14px_rgba(34,34,34,0.15)]"
                : "opacity-90"
            }`}
          >
            <Image
              src="/collections/title.png"
              alt=""
              width={632}
              height={202}
              className="h-[50px] w-full object-fill"
              aria-hidden="true"
            />
            <span className="absolute inset-0 flex items-center justify-center text-[0.8125rem] font-medium text-[#222222]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
