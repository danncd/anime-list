import { useMemo } from "react";
import { CaretRight, PencilSimple, User } from "@phosphor-icons/react";
import { countEntries, isFavorites, manualOrder, type CustomList } from "../../contracts/lists";
import type { Profile } from "../../contracts/profile";
import { useListCovers } from "../shared/useListCovers";

export interface ProfileCounts {
  readonly favorites: number;
  readonly lists: number;
  readonly titles: number;
}

export interface ProfilePageProps {
  readonly profile: Profile;
  readonly counts: ProfileCounts;
  readonly onEdit: () => void;
  readonly lists: readonly CustomList[];
  readonly onOpenList: (listId: string) => void;
}

export function ProfilePage({
  profile,
  counts,
  onEdit,
  lists,
  onOpenList,
}: ProfilePageProps) {
  /*
  Memoised: useListCovers keys its fetch on this array, so a fresh array each
  render would loop. Favorites is excluded because the sidebar and the count above
  already cover it; the hand-arranged order keeps pinned lists first here too.
  */
  const own = useMemo(
    () => manualOrder(lists.filter((list) => !isFavorites(list))),
    [lists],
  );
  const covers = useListCovers(own);

  return (
    <div className="browse-page">
      <div className="profile-banner">
        {profile.banner !== null && <img src={profile.banner} alt="" />}
      </div>

      <div className="profile-body">
        <div className="profile-crest">
          <span className="profile-pfp">
            {profile.picture !== null ? (
              <img src={profile.picture} alt="" />
            ) : (
              <User aria-hidden="true" />
            )}
          </span>

          <button
            type="button"
            className="profile-edit"
            aria-label="Edit profile"
            title="Edit profile"
            onClick={onEdit}
          >
            <PencilSimple />
          </button>
        </div>

        <p className="profile-name">{profile.name || "Your profile"}</p>
        {profile.username.length > 0 && (
          <p className="profile-handle">@{profile.username}</p>
        )}
        {profile.bio.length > 0 && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-stats">
          <span className="poster-pill">{counts.favorites} Favorites</span>
          <span className="poster-pill">{counts.lists} Lists</span>
          <span className="poster-pill">{counts.titles} Titles</span>
        </div>
      </div>

      {own.length > 0 && (
        <section className="profile-section">
          <h2 className="home-section-title">Your lists</h2>

          <div className="profile-lists">
            {own.map((list) => {
              const total = countEntries(list).total;
              const preview = covers.get(list.id) ?? [];
              return (
                <button
                  type="button"
                  className="profile-list-row"
                  key={list.id}
                  onClick={() => onOpenList(list.id)}
                >
                  <span className="profile-list-covers" aria-hidden="true">
                    {list.picture !== null ? (
                      <img className="profile-list-cover is-picture" src={list.picture} alt="" />
                    ) : (
                      Array.from({ length: 3 }, (_, index) => {
                        const cover = preview[index];
                        return cover ? (
                          <img className="profile-list-cover" src={cover} alt="" key={index} />
                        ) : (
                          <span className="profile-list-cover" key={index} />
                        );
                      })
                    )}
                  </span>

                  <span className="profile-list-body">
                    <span className="profile-list-name">{list.label}</span>
                    <span className="profile-list-meta">
                      {total} {total === 1 ? "title" : "titles"}
                    </span>
                  </span>

                  <span className="profile-list-chevron" aria-hidden="true">
                    <CaretRight />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
