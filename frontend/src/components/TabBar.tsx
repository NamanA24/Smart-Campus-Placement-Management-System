import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange }) => {
  return (
    <div className="tab-bar overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tab-btn flex items-center gap-2 ${active === tab.id ? 'active' : ''}`}
            type="button"
          >
            {tab.icon && (
              <span className={`w-4 h-4 ${active === tab.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
