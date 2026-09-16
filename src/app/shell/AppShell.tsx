import type { ReactNode, RefObject } from "react";

export interface AppShellProps {
  /* The pane's scroll container, so scroll positions can be remembered. */
  readonly contentRef: RefObject<HTMLDivElement | null>;
  readonly sidebarOpen: boolean;
  readonly sidebarWidth: number;
  readonly isDragging: boolean;
  readonly mainMaximum?: number;
  readonly toolbar: ReactNode;
  readonly sidebar: ReactNode;
  readonly main: ReactNode;
  readonly onResizeKeyDown?: ((event: React.KeyboardEvent) => void) | undefined;
  readonly onMainResizeStart: (event: React.PointerEvent) => void;
}

/* The window shell: one folder sidebar, its resize divider, and the main pane. */
export function AppShell({
  contentRef,
  sidebarOpen,
  sidebarWidth,
  isDragging,
  mainMaximum = 360,
  toolbar,
  sidebar,
  main,
  onResizeKeyDown,
  onMainResizeStart,
}: AppShellProps) {
  return (
    <div className="app-shell">
      {toolbar}

      <div className="workspace">
        <aside
          className={`folder-pane ${sidebarOpen ? "open" : "closed"}${isDragging ? " dragging" : ""}`}
          style={{ width: sidebarOpen ? sidebarWidth : 0 }}
          inert={!sidebarOpen}
        >
          <div className="folder-pane-inner" style={{ width: sidebarWidth }}>
            {sidebar}
          </div>
        </aside>

        <div
          className={`resize-handle ${sidebarOpen ? "" : "closed"}`}
          role="separator"
          aria-label="Main sidebar width"
          aria-orientation="vertical"
          aria-valuemin={190}
          aria-valuemax={mainMaximum}
          aria-valuenow={Math.round(sidebarWidth)}
          aria-hidden={!sidebarOpen}
          tabIndex={sidebarOpen ? 0 : -1}
          onKeyDown={onResizeKeyDown}
          onPointerDown={onMainResizeStart}
        />

        <main className="editor-pane">
          {/* The scroller is here rather than in each view, so there is one
              scroll position to remember and the overlay stays put. */}
          <div className="editor-scroll" ref={contentRef}>
            {main}
          </div>
        </main>
      </div>
    </div>
  );
}
