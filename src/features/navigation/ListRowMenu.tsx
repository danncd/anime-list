import { MoreGlyph, PinGlyph, Tick } from "../../ui/icons";
import { useMenu } from "../../ui/useMenu";

export interface ListRowMenuProps {
  readonly label: string;
  readonly pinned: boolean;
  readonly onSetPinned: (pinned: boolean) => void;
}

/* The browse pages' pill-menu classes, reused so every menu in the app is one
   surface. */
export function ListRowMenu({ label, pinned, onSetPinned }: ListRowMenuProps) {
  const menu = useMenu();

  return (
    /* A div, not a span: the menu it opens is a block. */
    <div className="nav-row-trail" ref={menu.root}>
      {pinned && (
        <span className="nav-row-pin" title="Pinned">
          <PinGlyph />
        </span>
      )}

      <button
        type="button"
        className={`nav-row-more${menu.open ? " is-open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={menu.open}
        aria-label={`More for ${label}`}
        onClick={menu.toggle}
      >
        <MoreGlyph />
      </button>

      {menu.open && (
        <div className="browse-pill-menu is-nav" ref={menu.menuRef} role="menu">
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={pinned}
            className={`browse-pill-option${pinned ? " is-on" : ""}`}
            onClick={() => {
              onSetPinned(!pinned);
              menu.close();
            }}
          >
            <span className="browse-pill-lead">
              <PinGlyph />
              <span>{pinned ? "Unpin" : "Pin to top"}</span>
            </span>
            {pinned && (
              <span className="browse-pill-dir">
                <Tick />
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
