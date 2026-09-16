import { Chevron, PlusGlyph } from "../../ui/icons";
import { ListRowMenu } from "./ListRowMenu";
import type { NavItem } from "./navigation";
import { NavIcon } from "./NavIcon";

export interface NavRowList {
  readonly pinned: boolean;
  readonly onSetPinned: (pinned: boolean) => void;
}

export interface NavRowProps {
  readonly item: NavItem;
  readonly isActive: boolean;
  readonly onSelect: (itemId: string) => void;
  /* Set only on a row that holds others. */
  readonly isBranch?: boolean;
  readonly expanded?: boolean;
  readonly onToggle?: (() => void) | undefined;
  readonly onAdd?: (() => void) | undefined;
  readonly isChild?: boolean;
  /* Present only for a row that is one of the user's lists. */
  readonly list?: NavRowList | undefined;
}

/*
A branch row leads with its chevron and trails a +, both siblings of the label: a
button cannot nest inside a button. The label navigates, the chevron opens and the
+ adds, and a list row is dragged by the row itself, so its ⋯ opts out.
*/
export function NavRow({
  item,
  isActive,
  onSelect,
  isBranch = false,
  expanded = false,
  onToggle,
  onAdd,
  isChild = false,
  list,
}: NavRowProps) {
  return (
    <div
      className={`nav-row${isActive ? " active" : ""}${isChild ? " is-child" : ""}`}
      data-drag-id={list ? item.id : undefined}
      /* A pinned list sits above the others, so it can be neither dragged nor a
         drop target. */
      data-drag-fixed={list?.pinned ? "true" : undefined}
    >
      {isBranch && onToggle ? (
        <button
          type="button"
          className={`nav-row-twig${expanded ? " is-open" : ""}`}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Hide" : "Show"} ${item.label}`}
          onClick={onToggle}
        >
          <Chevron dir="right" />
        </button>
      ) : (
        <NavIcon name={item.icon} />
      )}

      <button
        type="button"
        className="nav-row-main"
        aria-current={isActive ? "page" : undefined}
        onClick={() => onSelect(item.id)}
      >
        <span className="nav-row-label">{item.label}</span>
      </button>

      {onAdd && (
        <button
          type="button"
          className="nav-row-add"
          aria-label={`Add to ${item.label}`}
          onClick={onAdd}
        >
          <PlusGlyph />
        </button>
      )}

      {list && (
        <ListRowMenu label={item.label} pinned={list.pinned} onSetPinned={list.onSetPinned} />
      )}
    </div>
  );
}
