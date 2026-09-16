import { useDragOrder } from "../../ui/useDragOrder";
import type { NavItem, NavSection } from "./navigation";
import { YOUR_LISTS_ID } from "./navigation";
import { NavRow, type NavRowList } from "./NavRow";

export interface MainSidebarProps {
  readonly sections: readonly NavSection[];
  readonly activeItemId: string;
  readonly onSelectItem: (itemId: string) => void;
  readonly onCreateList: () => void;
  /* Moves a dragged list row; beforeId is null when it lands last. */
  readonly onReorderList: (listId: string, beforeId: string | null) => void;
  readonly onArrangeStart: () => void;
  readonly onSetPinned: (listId: string, pinned: boolean) => void;
  /* Unfolded branches, owned by the composition root so they survive a relaunch. */
  readonly expanded: readonly string[];
  readonly onToggleBranch: (itemId: string) => void;
}

/*
List rows are arranged by hand. Their drag floats the row and marks the landing
place with a line, which places small rows in a narrow column more precisely than
rows moving under the pointer.
*/
export function MainSidebar({
  sections,
  activeItemId,
  onSelectItem,
  onCreateList,
  onReorderList,
  onArrangeStart,
  onSetPinned,
  expanded,
  onToggleBranch,
}: MainSidebarProps) {

  const drag = useDragOrder({
    enabled: true,
    style: "line",
    /* The pin mark and ⋯ are row controls, not drag handles. */
    ignore: ".nav-row-trail",
    onDragStart: onArrangeStart,
    onDrop: onReorderList,
  });

  /* Only a user's list row carries a pin, so a set pin identifies one. */
  const listActions = (item: NavItem): NavRowList | undefined =>
    item.pinned === undefined
      ? undefined
      : { pinned: item.pinned, onSetPinned: (pinned) => onSetPinned(item.id, pinned) };

  return (
    <div className="sidebar-scroll-region">
      {sections.map((section) => (
        <div className="sidebar-section" key={section.id}>
          {section.label && <div className="section-label">{section.label}</div>}
          <div className="nav-list">
            {section.items.map((item) => {
              const isOpen = expanded.includes(item.id);
              return (
                <div key={item.id} className="nav-branch">
                  <NavRow
                    item={item}
                    isActive={item.id === activeItemId}
                    onSelect={onSelectItem}
                    isBranch={Boolean(item.children)}
                    expanded={isOpen}
                    onToggle={item.children ? () => onToggleBranch(item.id) : undefined}
                    onAdd={item.children ? onCreateList : undefined}
                  />
                  {isOpen && item.children && item.children.length > 0 && (
                    /* The drag container goes on the branch holding the user's own
                       lists, the only rows a drag may rearrange. */
                    <div
                      className="nav-children"
                      ref={item.id === YOUR_LISTS_ID ? drag.containerRef : undefined}
                    >
                      {item.children.map((child) => (
                        <NavRow
                          key={child.id}
                          item={child}
                          isActive={child.id === activeItemId}
                          onSelect={onSelectItem}
                          isChild
                          list={listActions(child)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
