import type { CSSProperties, ReactNode } from "react";

export interface ToolButtonProps {
  readonly label: string;
  readonly active?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly onClick?: ((event: React.MouseEvent<HTMLButtonElement>) => void) | undefined;
  readonly children: ReactNode;
}

export function ToolButton({
  label,
  active = false,
  disabled = false,
  className = "",
  style,
  onClick,
  children,
}: ToolButtonProps) {
  const classes = ["tool-button", active ? "active" : "", className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classes}
      style={style}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
