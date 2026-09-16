import { Fragment } from "react";
import type { AnimeSeason } from "../../contracts/filters";
import type { SeasonRef } from "../../platform/anilist";
import { Chevron } from "../../ui/icons";
import { CurrentDot, UpcomingStar } from "./SeasonMark";
import { useMenu } from "../../ui/useMenu";

export interface SeasonPickerProps {
  readonly options: readonly SeasonRef[];
  readonly season: AnimeSeason;
  readonly year: number;
  readonly onChange: (season: AnimeSeason, year: number) => void;
}

/*
Season the listing shows. Quarters that have not begun carry a star, so an
empty-looking listing reads as not aired yet rather than broken.
*/
export function SeasonPicker({ options, season, year, onChange }: SeasonPickerProps) {
  const menu = useMenu();
  const selected = options.find((option) => option.season === season && option.year === year);
  /* Mark for the chosen season; the pill shows it without opening the list. */
  const mark = selected
    ? selected.offset > 0
      ? "upcoming"
      : selected.offset === 0
        ? "current"
        : null
    : null;

  return (
    <div className="browse-control" ref={menu.root}>
      <button
        type="button"
        className={`browse-pill${menu.open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={menu.open}
        onClick={menu.toggle}
      >
        <span className="browse-pill-label">Season:</span>
        <span className="browse-pill-value">{selected?.label ?? `${season} ${year}`}</span>
        {mark !== null && (
          <span className="browse-mark-slot">
            {mark === "upcoming" ? <UpcomingStar /> : <CurrentDot />}
          </span>
        )}
        <span className="browse-pill-chevron">
          <Chevron dir="down" />
        </span>
      </button>

      {menu.open && (
        <div className="browse-pill-menu" ref={menu.menuRef} role="listbox" aria-label="Season">
          {options.map((option, index) => {
            const on = option.season === season && option.year === year;
            const startsYear = index === 0 || options[index - 1]?.year !== option.year;
            return (
              <Fragment key={`${option.season}-${option.year}`}>
                {startsYear && <p className="browse-pill-group">{option.year}</p>}
                <button
                  type="button"
                  role="option"
                  aria-label={option.label}
                  aria-selected={on}
                  className={`browse-pill-option${on ? " is-on" : ""}`}
                  onClick={() => {
                    onChange(option.season, option.year);
                    menu.close();
                  }}
                >
                  <span>{option.name}</span>
                  {}
                  {option.offset > 0 ? (
                    <span className="browse-mark-slot">
                      <UpcomingStar />
                    </span>
                  ) : option.offset === 0 ? (
                    <span className="browse-mark-slot">
                      <CurrentDot />
                    </span>
                  ) : null}
                </button>
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
