import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../../data/taxonomy';
import { TOOLS_REGISTRY } from '../../data/registry';
import {
  Zap,
  Cpu,
  Activity,
  Layers,
  BatteryCharging,
  Box,
  Radio,
  Binary,
  Terminal,
  Flame,
  BarChart2,
  Sigma,
  BookOpen,
  BookMarked,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Star,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeToolId: string;
  onSelectTool: (slug: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  circuit: Zap,
  electrical: Cpu,
  power: Activity,
  components: Layers,
  batteries: BatteryCharging,
  pcb: Box,
  rf: Radio,
  digital: Binary,
  embedded: Terminal,
  thermal: Flame,
  signals: BarChart2,
  math: Sigma,
  reference: BookOpen,
  formulas: BookMarked,
  design: Briefcase,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeToolId,
  onSelectTool,
  isOpenMobile,
  onCloseMobile,
  favorites,
  onToggleFavorite,
}) => {
  // Track open categories accordion state
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    circuit: true,
    design: true,
  });

  const [showAllQuickTools, setShowAllQuickTools] = useState(false);

  // Auto-expand category containing the active tool
  useEffect(() => {
    const currentTool = TOOLS_REGISTRY.find((t) => t.id === activeToolId);
    if (currentTool?.category) {
      setOpenCategories((prev) => ({
        ...prev,
        [currentTool.category]: true,
      }));
    }
  }, [activeToolId]);

  const toggleCategory = (catId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const favoriteTools = TOOLS_REGISTRY.filter((t) => favorites.includes(t.id));
  const quickList = favoriteTools.length > 0 
    ? favoriteTools 
    : TOOLS_REGISTRY.slice(0, 6);

  const displayedQuickTools = showAllQuickTools ? TOOLS_REGISTRY : quickList;

  const content = (
    <div className="h-full flex flex-col justify-between overflow-y-auto py-4 px-3">
      <div className="flex flex-col gap-5">
        {/* Mobile close button */}
        <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Toolbox Navigation
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation sidebar"
            className="p-1 rounded text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Access / Starred Tools */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-cyan-400">
              {favoriteTools.length > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  Starred Favorites
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Access
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowAllQuickTools(!showAllQuickTools)}
              aria-label="Toggle show all tools list"
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900/60 cursor-pointer"
            >
              {showAllQuickTools ? 'Compact' : `${TOOLS_REGISTRY.length} Tools`}
            </button>
          </div>

          <div className="flex flex-col gap-0.5 mt-1">
            {displayedQuickTools.map((tool) => {
              const isActive = activeToolId === tool.id;
              const isFav = favorites.includes(tool.id);

              return (
                <div
                  key={tool.id}
                  onClick={() => {
                    onSelectTool(tool.id);
                    onCloseMobile();
                  }}
                  className={`group px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-700/60 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <span className="truncate">{tool.name.replace(' Calculator', '')}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tool.id);
                    }}
                    aria-label={isFav ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
                    className={`text-[11px] p-0.5 rounded hover:text-amber-400 transition-colors ${
                      isFav ? 'text-amber-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    ★
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Domain Taxonomy Categories */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
          <div className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Domain Taxonomy ({CATEGORIES.length} Categories)
          </div>

          <div className="flex flex-col gap-1">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON_MAP[cat.id] || Zap;
              const isOpen = !!openCategories[cat.id];
              const categoryTools = TOOLS_REGISTRY.filter((t) => t.category === cat.id);

              return (
                <div key={cat.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    aria-expanded={isOpen}
                    aria-label={`Toggle ${cat.name} category`}
                    className="w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-cyan-500 font-bold">
                        [{cat.letter}]
                      </span>
                      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {categoryTools.length > 0 && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                          {categoryTools.length}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pl-6 pr-1 py-1 flex flex-col gap-0.5 border-l border-slate-800/80 ml-3.5 my-0.5">
                      {categoryTools.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSelectTool(t.id);
                            onCloseMobile();
                          }}
                          className={`text-left text-xs py-1 px-2 rounded truncate transition-colors cursor-pointer ${
                            activeToolId === t.id
                              ? 'text-cyan-400 font-semibold bg-cyan-950/40'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}

                      {categoryTools.length === 0 && (
                        <span className="text-[11px] text-slate-600 italic py-0.5 px-2">
                          Roadmap tools ({cat.toolCount} planned)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engineering Standards Footer */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 px-2 flex flex-col gap-1 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center justify-between">
          <span>Standards:</span>
          <span className="text-slate-400">IEC 60062 / E24</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Computation:</span>
          <span className="text-emerald-400">100% In-Browser</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Persistence:</span>
          <span className="text-slate-400">LocalStorage</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-md h-[calc(100vh-4rem)] sticky top-16">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-full bg-slate-950 border-r border-slate-800 z-10 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
