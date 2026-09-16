import { useEffect, useRef, useState } from "react";
import { ImageSquare, UploadSimple, User, X } from "@phosphor-icons/react";
import type { Profile } from "../../contracts/profile";

export interface EditProfileDialogProps {
  readonly profile: Profile;
  readonly onSave: (profile: Profile) => void;
  readonly onClose: () => void;
}

/*
The banner and picture preview at the sizes the profile page uses, so the choice
here matches what the page will show.
*/
export function EditProfileDialog({ profile, onSave, onClose }: EditProfileDialogProps) {
  const [draft, setDraft] = useState<Profile>(profile);
  const bannerRef = useRef<HTMLInputElement>(null);
  const pictureRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const choose = (file: File | undefined, field: "banner" | "picture") => {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setDraft((current) => ({ ...current, [field]: reader.result as string }));
      }
    });
    reader.readAsDataURL(file);
  };

  const field = (key: "name" | "username" | "bio", value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal-dialog profile-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div className="modal-head-text">
            <h2 className="modal-title" id="edit-profile-title">
              Edit profile
            </h2>
            <p className="modal-subtitle">Only you see this</p>
          </div>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>

        <button type="button" className="edit-banner" onClick={() => bannerRef.current?.click()}>
          {draft.banner ? (
            <>
              <img src={draft.banner} alt="" />
              <span className="pick-overlay" aria-hidden="true">
                <UploadSimple />
              </span>
            </>
          ) : (
            <>
              <ImageSquare />
              <span>Add a banner</span>
            </>
          )}
        </button>

        <div className="edit-crest">
          <button
            type="button"
            className="edit-pfp"
            aria-label="Change profile picture"
            onClick={() => pictureRef.current?.click()}
          >
            {draft.picture ? (
              <>
                <img src={draft.picture} alt="" />
                <span className="pick-overlay" aria-hidden="true">
                  <UploadSimple />
                </span>
              </>
            ) : (
              <User />
            )}
          </button>
        </div>

        <div className="edit-fields">
          <label className="modal-field">
            <span className="modal-field-label">Name</span>
            <input
              type="text"
              value={draft.name}
              placeholder="Your name"
              onChange={(event) => field("name", event.target.value)}
            />
          </label>

          <label className="modal-field">
            <span className="modal-field-label">Username</span>
            <span className="field-prefix">
              <input
                type="text"
                value={draft.username}
                placeholder="username"
                onChange={(event) => field("username", event.target.value)}
              />
            </span>
          </label>

          <label className="modal-field">
            <span className="modal-field-label">Bio</span>
            <textarea
              value={draft.bio}
              placeholder="A line about yourself"
              onChange={(event) => field("bio", event.target.value)}
            />
          </label>
        </div>

        <div className="modal-foot">
          <button
            type="button"
            className="modal-btn"
            onClick={() => setDraft({ ...draft, banner: null, picture: null })}
          >
            Clear pictures
          </button>
          <button type="button" className="modal-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="modal-btn is-primary" onClick={() => onSave(draft)}>
            Save
          </button>
        </div>

        <input
          ref={bannerRef}
          type="file"
          accept="image/*"
          className="new-list-file"
          onChange={(event) => choose(event.target.files?.[0], "banner")}
        />
        <input
          ref={pictureRef}
          type="file"
          accept="image/*"
          className="new-list-file"
          onChange={(event) => choose(event.target.files?.[0], "picture")}
        />
      </div>
    </div>
  );
}
