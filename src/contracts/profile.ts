/*
The local profile. There is no account, so missing values are stored as empty
strings or null and rendered as placeholders.
*/
export interface Profile {
  readonly name: string;
  readonly username: string;
  readonly bio: string;
  /* Data URLs chosen by the user, or null to show the placeholder. */
  readonly banner: string | null;
  readonly picture: string | null;
}

export function emptyProfile(): Profile {
  return { name: "", username: "", bio: "", banner: null, picture: null };
}
