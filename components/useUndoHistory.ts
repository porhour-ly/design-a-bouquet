import { useRef, useCallback } from "react";
import type { Flower } from "@/lib/bouquetData";

export function useUndoHistory(maxSize = 50) {
  const historyRef = useRef<Flower[][]>([]);

  const pushSnapshot = useCallback(
    (flowers: Flower[]) => {
      historyRef.current.push(flowers.map((f) => ({ ...f })));
      if (historyRef.current.length > maxSize) historyRef.current.shift();
    },
    [maxSize]
  );

  const popSnapshot = useCallback((): Flower[] | null => {
    return historyRef.current.pop() ?? null;
  }, []);

  const canUndo = useCallback(() => historyRef.current.length > 0, []);

  return { pushSnapshot, popSnapshot, canUndo };
}
