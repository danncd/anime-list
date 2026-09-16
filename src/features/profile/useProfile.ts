import { useEffect, useState } from "react";
import type { Profile } from "../../contracts/profile";
import { loadProfile, saveProfile } from "../../platform/profile/storage";

export interface ProfileStore {
  readonly profile: Profile;
  readonly save: (profile: Profile) => void;
}

export function useProfile(): ProfileStore {
  const [profile, setProfile] = useState<Profile>(loadProfile);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  return { profile, save: setProfile };
}
