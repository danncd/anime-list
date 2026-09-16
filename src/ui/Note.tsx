import type { ReactNode } from "react";

/*
The one line a surface shows when it has nothing to show: empty, filtered to
nothing, or unable to reach the API.
*/
export function Note({
  children,
  /* The browse pages sit a note above what follows; Home and a title's page do
     not. */
  spaced = false,
}: {
  readonly children: ReactNode;
  readonly spaced?: boolean;
}) {
  return <p className={`note${spaced ? " is-spaced" : ""}`}>{children}</p>;
}
