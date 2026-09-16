import type { MediaSortKey } from "../../contracts/filters";
import { SORT_LABELS, SORT_ORDER } from "../../platform/anilist";
import { SortArrow } from "../../ui/icons";
import { useMenu } from "../../ui/useMenu";

export interface SortOption<K extends string> {
  readonly key: K;
  readonly label: string;
  /* No ascending or descending form, so no arrow appears in the pill or menu. */
  readonly directionless?: boolean;
}

export interface SortMenuProps<K extends string> {
  readonly label: string;
  readonly options: readonly SortOption<K>[];
  readonly value: K;
  readonly descending: boolean;
  readonly onChange: (key: K, descending: boolean) => void;
  /* Direction a newly chosen option opens in. */
  readonly descendingFor?: (key: K) => boolean;
  readonly heading?: string;
}

/*
One order control: a pill showing the order in force and its direction, and a
menu of the options. Choosing the option already in force flips its direction.
*/
export function SortMenu<K extends string>({
  label,
  options,
  value,
  descending,
  onChange,
  descendingFor,
  heading = "Order by",
}: SortMenuProps<K>) {
  const menu = useMenu();
  const current = options.find((option) => option.key === value);

  const choose = (key: K) => {
    const option = options.find((candidate) => candidate.key === key);
    /* Choosing closes the menu; the pill's arrow carries the direction afterwards. */
    menu.close();
    if (key === value) {
      /* A directionless option has no arrow to flip. */
      if (option?.directionless) return;
      onChange(key, !descending);
      return;
    }
    onChange(key, descendingFor ? descendingFor(key) : true);
  };

  return (
    <div className="browse-control" ref={menu.root}>
      <button
        type="button"
        className={`browse-pill${menu.open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={menu.open}
        onClick={menu.toggle}
      >
        <span className="browse-pill-label">{label}</span>
        <span className="browse-pill-value">{current?.label ?? ""}</span>
        {!current?.directionless && (
          <span className="browse-pill-arrow">
            <SortArrow descending={descending} />
          </span>
        )}
      </button>

      {menu.open && (
        <div className="browse-pill-menu" ref={menu.menuRef} role="listbox" aria-label={heading}>
          <p className="browse-pill-heading">{heading}</p>
          {options.map((option) => {
            const selected = option.key === value;
            return (
              <button
                type="button"
                role="option"
                key={option.key}
                aria-selected={selected}
                className={`browse-pill-option${selected ? " is-on" : ""}`}
                onClick={() => choose(option.key)}
              >
                <span>{option.label}</span>
                {selected && !option.directionless && (
                  <span className="browse-pill-dir">
                    <SortArrow descending={descending} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const MEDIA_SORT_OPTIONS: readonly SortOption<MediaSortKey>[] = SORT_ORDER.map(
  (key) => ({ key, label: SORT_LABELS[key] }),
);
