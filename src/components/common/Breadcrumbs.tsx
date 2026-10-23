import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-mono text-slate-400 py-2 overflow-x-auto">
      <button
        type="button"
        onClick={items[0]?.onClick}
        className="flex items-center gap-1 hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400" />
        <span className="hidden sm:inline">Home</span>
      </button>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast || !item.onClick ? (
              <span
                className="font-semibold text-cyan-300 truncate max-w-xs"
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer truncate max-w-xs"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
