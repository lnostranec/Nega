"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** true только на клиенте после гидрации (без setState в effect) */
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
