export interface DetailTabItem {
  readonly id: string;
  readonly label: string;
  /* Already formatted; carries a trailing "+" while more is known to exist but
     not yet loaded. Null for panels with nothing countable. */
  readonly count: string | null;
}

export interface DetailTabsProps {
  readonly tabs: readonly DetailTabItem[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}

export function DetailTabs({ tabs, activeId, onSelect }: DetailTabsProps) {
  return (
    <div className="detail-tabs" role="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`detail-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`detail-panel-${tab.id}`}
            className={`detail-tab${selected ? " is-active" : ""}`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
            {tab.count !== null && <span className="detail-tab-count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
