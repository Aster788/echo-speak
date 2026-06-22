"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type ReviewResetContextValue = {
  registerReset: (reset: () => void) => () => void;
  resetReviewHome: () => void;
};

const ReviewResetContext = createContext<ReviewResetContextValue | null>(null);

export function ReviewResetProvider({ children }: { children: ReactNode }) {
  const resetRef = useRef<(() => void) | null>(null);

  const registerReset = useCallback((reset: () => void) => {
    resetRef.current = reset;
    return () => {
      if (resetRef.current === reset) {
        resetRef.current = null;
      }
    };
  }, []);

  const resetReviewHome = useCallback(() => {
    resetRef.current?.();
  }, []);

  const value = useMemo(
    () => ({ registerReset, resetReviewHome }),
    [registerReset, resetReviewHome]
  );

  return (
    <ReviewResetContext.Provider value={value}>
      {children}
    </ReviewResetContext.Provider>
  );
}

export function useReviewReset() {
  return useContext(ReviewResetContext);
}
