import { Sidebar, SidebarSimple } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { ContentSearch } from "../../features/search/ContentSearch";
import { useWindowDrag } from "../../platform/desktop/useWindowDrag";
import { Chevron } from "../../ui/icons";
import { ToolButton } from "../../ui/ToolButton";

export interface WindowToolbarProps {
  readonly sidebarOpen: boolean;
  /* Visible width of the sidebar; 0 while it is closed. */
  readonly sidebarWidth: number;
  readonly searchQuery: string;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly onToggleSidebar: () => void;
  readonly onSearchQueryChange: (query: string) => void;
  /* True while the sidebar edge is being dragged. */
  readonly isDragging: boolean;
  /* Runs the query in Explore All, where the full result set lives. */
  readonly onSearchAll: (query: string) => void;
  readonly onOpenAnime: (animeId: number) => void;
  readonly onBack: () => void;
  readonly onForward: () => void;
}

/*
While the sidebar is open the controls sit flush at 36px; once it closes they
widen to 37px and a gap opens between them, so the cluster does not read as one
bar. The nav sits at the content area's left edge and the search row is centred on
the content area.
*/
const OPEN_CONTROL_WIDTH = 36;
const PILL_SIZE = 37;
const CONTROL_LEFT = 89;
const NAV_SIZE = 37;
const NAV_GAP = 6;
const NAV_INSET = 14;
const NAV_CLEARANCE = 12;

export function WindowToolbar({
  sidebarOpen,
  sidebarWidth,
  searchQuery,
  canGoBack,
  canGoForward,
  onToggleSidebar,
  onSearchQueryChange,
  isDragging,
  onSearchAll,
  onOpenAnime,
  onBack,
  onForward,
}: WindowToolbarProps) {
  const pillClass = sidebarOpen ? "" : "is-pill";
  const windowDrag = useWindowDrag();
  const controlStyle: CSSProperties = { width: sidebarOpen ? OPEN_CONTROL_WIDTH : PILL_SIZE };
  const controlRight = CONTROL_LEFT + (sidebarOpen ? OPEN_CONTROL_WIDTH : PILL_SIZE);

  /* Open, the content area already starts past the controls, so the nav sits at
     its edge. Closed, that edge is the window edge, so it steps past them. */
  const navLeft = sidebarOpen ? sidebarWidth + NAV_INSET : controlRight + NAV_CLEARANCE;
  const navWidth = NAV_SIZE * 2 + NAV_GAP;

  /* The search row reserves the nav's footprint up front, so the field centres in
     the space left and can never slide under it at any window width. */
  const searchInset = navLeft - sidebarWidth + navWidth + NAV_CLEARANCE;

  return (
    <header className={`toolbar${isDragging ? " is-dragging" : ""}`} {...windowDrag}>
      {/*
      Opaque over the content, so nothing scrolling under the toolbar shows
      through. It begins past the resize handle rather than at the sidebar's
      width: the handle is a 0.5px column of its own, and covering it hid its
      line and its hover.
      */}
      <div
        className="toolbar-content-fill"
        style={{ left: sidebarWidth + 0.5 }}
        aria-hidden="true"
      />
      {/* Left controls: the traffic light reservation, then the sidebar toggle. */}
      <div
        className="header-controls"
        /* One control, so the 36px/37px nudge keeps its icon centre where it was. */
        style={{ left: CONTROL_LEFT + (sidebarOpen ? (PILL_SIZE - OPEN_CONTROL_WIDTH) / 2 : 0) }}
      >
        <ToolButton
          label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className={pillClass}
          style={controlStyle}
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <Sidebar /> : <SidebarSimple />}
        </ToolButton>
      </div>

      {/* View history, always visible; disabled at either end */}
      <div className="content-nav" style={{ left: navLeft }}>
        <button
          type="button"
          className="content-nav-button"
          aria-label="Back"
          disabled={!canGoBack}
          onClick={onBack}
        >
          <Chevron dir="left" weight={1.7} />
        </button>
        <button
          type="button"
          className="content-nav-button"
          aria-label="Forward"
          disabled={!canGoForward}
          onClick={onForward}
        >
          <Chevron dir="right" weight={1.7} />
        </button>
      </div>

      <div className="content-search-row" style={{ left: sidebarWidth, paddingLeft: searchInset }}>
        <ContentSearch
          value={searchQuery}
          onChange={onSearchQueryChange}
          onSearchAll={onSearchAll}
          onOpenAnime={onOpenAnime}
        />
      </div>
    </header>
  );
}
