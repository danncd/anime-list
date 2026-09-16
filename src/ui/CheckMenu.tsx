import { Chevron, Tick } from "./icons";
import { useMenu } from "./useMenu";

/*
A multi-select dropdown: only the box marks a choice, and the menu stays open while
options are picked.
*/
export interface CheckMenuProps {
  readonly label: string;
  readonly anyLabel: string;
  readonly values: readonly string[];
  readonly selected: readonly string[];
  readonly onChange: (next: readonly string[]) => void;
  readonly loading: boolean;
}

export function CheckMenu({
  label,
  anyLabel,
  values,
  selected,
  onChange,
  loading,
}: CheckMenuProps) {
  const menu = useMenu();

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((entry) => entry !== value)
        : [...selected, value],
    );
  };

  return (
    <div className="browse-field" ref={menu.root}>
      <span className="browse-field-label">{label}</span>
      <button
        type="button"
        className={`browse-pill${menu.open ? " is-open" : ""}`}
        aria-haspopup="true"
        aria-expanded={menu.open}
        onClick={menu.toggle}
      >
        <span className="browse-pill-value">
          {selected.length === 0 ? anyLabel : `${anyLabel} +${selected.length}`}
        </span>
        <span className="browse-pill-chevron">
          <Chevron dir="down" />
        </span>
      </button>

      {menu.open && (
        <div className="browse-pill-menu is-wide" ref={menu.menuRef}>
          <div className="browse-check-head">
            <span>{label}</span>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => onChange([])}
            >
              Clear
            </button>
          </div>

          {loading ? (
            <p className="browse-check-note">Loading…</p>
          ) : values.length === 0 ? (
            /* Empty means either a failed vocabulary load or no options at all. */
            <p className="browse-check-note">Nothing to choose from.</p>
          ) : (
            <div className="browse-check-grid" role="group" aria-label={label}>
              {values.map((value) => {
                const on = selected.includes(value);
                return (
                  <button
                    type="button"
                    key={value}
                    role="checkbox"
                    aria-checked={on}
                    className={`browse-check-row${on ? " is-on" : ""}`}
                    onClick={() => toggle(value)}
                  >
                    <span className="browse-check-box">
                      <Tick />
                    </span>
                    <span className="browse-check-name">{value}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
