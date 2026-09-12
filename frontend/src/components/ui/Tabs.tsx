import { type ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-ink-200 overflow-x-auto no-scrollbar">
      <div className="flex gap-1 min-w-max" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={[
                "relative inline-flex items-center gap-2 px-4 h-11 text-body-sm font-medium",
                "transition-colors whitespace-nowrap",
                "border-b-2 -mb-px",
                isActive
                  ? "border-gold-500 text-ink-900"
                  : "border-transparent text-ink-600 hover:text-ink-900 hover:border-ink-300",
              ].join(" ")}
            >
              {tab.icon && (
                <span className={isActive ? "text-gold-500" : "text-ink-500"}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={[
                    "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1",
                    "text-micro font-semibold tabular-nums rounded-full",
                    isActive
                      ? "bg-gold-100 text-gold-700"
                      : "bg-ink-100 text-ink-600",
                  ].join(" ")}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
