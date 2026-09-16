import { useEffect, useState } from "react";
import type { ExploreFilters } from "../../contracts/filters";
import {
  COUNTRY_LABELS,
  FORMAT_LABELS,
  SEASON_LABELS,
  SEASON_ORDER,
  SORT_LABELS,
  SORT_ORDER,
  STATUS_LABELS,
  fetchGenres,
  fetchTags,
  statusLabel,
} from "../../platform/anilist";
import { CheckMenu } from "../../ui/CheckMenu";
import { Chevron } from "../../ui/icons";
import { useMenu } from "../../ui/useMenu";

interface Choice<K extends string> {
  readonly value: K;
  readonly label: string;
}

/* Newest first; 60 years spans AniList's own catalogue. */
const YEAR_SPAN = 60;

function yearOptions(): readonly number[] {
  const now = new Date().getFullYear();
  return Array.from({ length: YEAR_SPAN }, (_, index) => now + 1 - index);
}

/* A single-choice field; multi-choice ones use CheckMenu. */
/*
Generic in the value it chooses, so a field for a specific set of keys hands back
those keys.
*/
function SelectField<K extends string>({
  label,
  anyLabel,
  value,
  choices,
  onChange,
}: {
  readonly label: string;
  readonly anyLabel: string;
  readonly value: K | null;
  readonly choices: readonly Choice<K>[];
  readonly onChange: (value: K | null) => void;
}) {
  const menu = useMenu();
  const current = choices.find((choice) => choice.value === value);

  return (
    <div className="browse-field" ref={menu.root}>
      <span className="browse-field-label">{label}</span>
      <button
        type="button"
        className={`browse-pill${menu.open ? " is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={menu.open}
        onClick={menu.toggle}
      >
        <span className="browse-pill-value">{current?.label ?? anyLabel}</span>
        <span className="browse-pill-chevron">
          <Chevron dir="down" />
        </span>
      </button>

      {menu.open && (
        <div className="browse-pill-menu" role="listbox" ref={menu.menuRef}>
          <button
            type="button"
            role="option"
            aria-selected={value === null}
            className={`browse-pill-option${value === null ? " is-on" : ""}`}
            onClick={() => {
              onChange(null);
              menu.close();
            }}
          >
            {anyLabel}
          </button>
          {choices.map((choice) => (
            <button
              type="button"
              key={choice.value}
              role="option"
              aria-selected={choice.value === value}
              className={`browse-pill-option${choice.value === value ? " is-on" : ""}`}
              onClick={() => {
                onChange(choice.value);
                menu.close();
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ExploreFiltersProps {
  readonly filters: ExploreFilters;
  readonly onChange: (next: ExploreFilters) => void;
}

/* Genres and tags come from AniList, not from loaded titles, so an option never
   returns nothing. */
function useVocabularies(): { readonly genres: readonly string[]; readonly tags: readonly string[]; readonly loading: boolean } {
  const [state, setState] = useState<{ genres: readonly string[]; tags: readonly string[]; loading: boolean }>({
    genres: [],
    tags: [],
    loading: true,
  });

  useEffect(() => {
    let active = true;
    Promise.all([fetchGenres(), fetchTags()]).then(
      ([genres, tags]) => {
        if (active) setState({ genres, tags, loading: false });
      },
      () => {
        if (active) setState({ genres: [], tags: [], loading: false });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export function ExploreFilters({ filters, onChange }: ExploreFiltersProps) {
  const vocabularies = useVocabularies();
  const patch = (values: Partial<ExploreFilters>) => onChange({ ...filters, ...values });

  return (
    <div className="browse-filters">
      <SelectField
        label="Type"
        anyLabel="All"
        value={filters.type}
        choices={[
          { value: "ANIME", label: "Anime" },
          { value: "MANGA", label: "Manga" },
        ]}
        onChange={(value) => patch({ type: value })}
      />

      <SelectField
        label="Format"
        anyLabel="Any format"
        value={filters.format}
        choices={Object.entries(FORMAT_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(value) => patch({ format: value })}
      />

      <SelectField
        label="Status"
        anyLabel="Any status"
        value={filters.status}
        choices={Object.keys(STATUS_LABELS).map((value) => ({
          value,
          /* The menu shows short options, so the short status label. */
          label: statusLabel(value, "short"),
        }))}
        onChange={(value) => patch({ status: value })}
      />

      <CheckMenu
        label="Genres"
        anyLabel="Any genres"
        values={vocabularies.genres}
        selected={filters.genres}
        loading={vocabularies.loading}
        onChange={(genres) => patch({ genres })}
      />

      <CheckMenu
        label="Tags"
        anyLabel="Any tags"
        values={vocabularies.tags}
        selected={filters.tags}
        loading={vocabularies.loading}
        onChange={(tags) => patch({ tags })}
      />

      <SelectField
        label="Country"
        anyLabel="Any country"
        value={filters.country}
        choices={Object.entries(COUNTRY_LABELS).map(([value, label]) => ({ value, label }))}
        onChange={(value) => patch({ country: value })}
      />

      <SelectField
        label="Year"
        anyLabel="Any year"
        value={filters.year === null ? null : String(filters.year)}
        choices={yearOptions().map((year) => ({ value: String(year), label: String(year) }))}
        onChange={(value) => patch({ year: value === null ? null : Number(value) })}
      />

      <SelectField
        label="Season"
        anyLabel="Any season"
        value={filters.season}
        choices={SEASON_ORDER.map((value) => ({ value, label: SEASON_LABELS[value] }))}
        onChange={(value) => patch({ season: value })}
      />

      <SelectField
        label="Order by"
        anyLabel="Popularity"
        value={filters.sort}
        choices={SORT_ORDER.map((value) => ({ value, label: SORT_LABELS[value] }))}
        onChange={(value) =>
          patch({
            sort: value ?? "popularity",
            /* Choosing the order already in force turns it over. */
            descending: value === filters.sort ? !filters.descending : true,
          })
        }
      />
    </div>
  );
}
