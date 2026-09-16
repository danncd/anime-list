import { emptyProfile, type Profile } from "../../contracts/profile";

const KEY = "anime-2.profile.v1";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/* A data URL from a file input, or null; the page shows a placeholder otherwise. */
function image(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

/* Stored JSON is untrusted, as in the lists store. */
export function loadProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProfile();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return emptyProfile();
    const record = parsed as Record<string, unknown>;
    return {
      name: text(record["name"]),
      username: text(record["username"]),
      bio: text(record["bio"]),
      banner: image(record["banner"]),
      picture: image(record["picture"]),
    };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile: Profile): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* Full or disabled storage: the session still works from memory. */
  }
}
