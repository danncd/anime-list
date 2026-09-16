import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { ListOrder } from "../contracts/lists";
import { loadListOrder, saveListOrder } from "../platform/lists/storage";

export interface ListOrderStore {
  readonly order: ListOrder;
  readonly setOrder: Dispatch<SetStateAction<ListOrder>>;
  /* Arranging by hand is what Custom means, so the first move selects it. */
  readonly arrangeByHand: () => void;
}

/*
The order the lists page is shown in. A preference rather than data, so it is kept
apart from the lists it describes.
*/
export function useListOrder(): ListOrderStore {
  const [order, setOrder] = useState<ListOrder>(loadListOrder);

  useEffect(() => {
    saveListOrder(order);
  }, [order]);

  const arrangeByHand = useCallback(() => {
    setOrder((current) => (current.mode === "custom" ? current : { ...current, mode: "custom" }));
  }, []);

  return { order, setOrder, arrangeByHand };
}
