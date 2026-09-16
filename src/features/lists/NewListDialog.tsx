import { useEffect, useRef, useState } from "react";
import { ImageSquare, UploadSimple, X } from "@phosphor-icons/react";
import type { ListDraft } from "../../contracts/lists";
import { ConfirmButton } from "../../ui/ConfirmButton";

export interface NewListDialogProps {
  readonly onCreate: (draft: ListDraft) => void;
  readonly onClose: () => void;
  /* Present when editing: the fields open filled and the labels change. */
  readonly initial?: ListDraft | undefined;
  /* Editing only; removal takes two presses, like other destructive actions here. */
  readonly onDelete?: (() => void) | undefined;
}

/* The New List dialog. The picture is optional and sits in the frame a cover
   would occupy. */
export function NewListDialog({ onCreate, onClose, initial, onDelete }: NewListDialogProps) {
  const editing = initial !== undefined;
  const [armed, setArmed] = useState(false);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [picture, setPicture] = useState<string | null>(initial?.picture ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const choosePicture = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") setPicture(reader.result);
    });
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 className="modal-title" id="modal-title">
            {editing ? "Edit List" : "New List"}
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="new-list-body">
          <button
            type="button"
            className={`new-list-picture${picture ? " has-picture" : ""}`}
            onClick={() => fileRef.current?.click()}
          >
            {picture ? (
              <>
                <img src={picture} alt="" />
                {/* The overlay marks the picture as replaceable on click. */}
                <span className="pick-overlay" aria-hidden="true">
                  <UploadSimple />
                </span>
              </>
            ) : (
              <>
                <ImageSquare />
                <span>Add a picture</span>
                <span className="new-list-optional">(Optional)</span>
              </>
            )}
          </button>


          <label className="modal-field">
            <span className="modal-field-label">Title</span>
            <input
              type="text"
              value={label}
              placeholder="New list"
              autoFocus
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>

          <label className="modal-field modal-field-wide">
            <span className="modal-field-label">Description</span>
            <textarea
              value={description}
              placeholder="What is this list for?"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </div>

        <div className="modal-foot">
          {onDelete && (
            /* Two-step delete: the bin arms into a check before it fires. */
            <ConfirmButton
              className="remove-circle is-static"
              label="Delete this list"
              confirmLabel="Confirm deleting this list"
              armed={armed}
              onArm={() => setArmed(true)}
              onConfirm={onDelete}
              onDisarm={() => setArmed(false)}
            />
          )}

          {picture !== null && (
            <button type="button" className="modal-btn" onClick={() => setPicture(null)}>
              Clear picture
            </button>
          )}

          <button type="button" className="modal-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn is-primary"
            onClick={() => onCreate({ label, description, picture })}
          >
            {editing ? "Save" : "Create List"}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="new-list-file"
          onChange={(event) => choosePicture(event.target.files?.[0])}
        />
      </div>
    </div>
  );
}
