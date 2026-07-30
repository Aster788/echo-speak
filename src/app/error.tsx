"use client";

import { useEffect } from "react";
import {
  isRecoverableClientError,
  reloadOnceForRecoverableError,
} from "@/lib/client-recovery";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    reloadOnceForRecoverableError(error.message, error.name);
  }, [error]);

  const recoverable = isRecoverableClientError(error.message, error.name);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-[0.875rem] text-[#222222]">
        {recoverable
          ? "Connection interrupted. Reloading…"
          : "Something went wrong on this page."}
      </p>
      <button
        type="button"
        onClick={() => {
          if (!reloadOnceForRecoverableError(error.message, error.name)) {
            reset();
          }
        }}
        className="rounded-[1rem] border-[2.5px] border-[#000000] bg-[#000000] px-4 py-2.5 text-[0.8125rem] font-medium text-[#FFFFFF]"
      >
        Try again
      </button>
    </div>
  );
}
