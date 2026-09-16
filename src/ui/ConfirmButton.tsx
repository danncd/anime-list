import { Check, Trash } from "@phosphor-icons/react";

export interface ConfirmButtonProps {
  /* The surface's own class; the armed state is added to it. */
  readonly className: string;
  readonly label: string;
  readonly confirmLabel: string;
  readonly armed: boolean;
  readonly onArm: () => void;
  readonly onConfirm: () => void;
  readonly onDisarm: () => void;
}

/*
A destructive action that arms on the first press and acts on the second. The
caller owns which item is armed, since a list's rows arm one at a time.
*/
export function ConfirmButton({
  className,
  label,
  confirmLabel,
  armed,
  onArm,
  onConfirm,
  onDisarm,
}: ConfirmButtonProps) {
  return (
    <button
      type="button"
      className={`${className}${armed ? " is-armed" : ""}`}
      aria-label={armed ? confirmLabel : label}
      title={armed ? confirmLabel : label}
      onClick={() => (armed ? onConfirm() : onArm())}
      onBlur={onDisarm}
    >
      {armed ? <Check /> : <Trash />}
    </button>
  );
}
