"use client";

import { useEffect } from "react";
import {
  isRecoverableClientError,
  reloadOnceForRecoverableError,
} from "@/lib/client-recovery";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reloadOnceForRecoverableError(error.message, error.name);
  }, [error]);

  const recoverable = isRecoverableClientError(error.message, error.name);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#222222]/[0.04] text-[#222222] antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-[0.875rem]">
            {recoverable
              ? "Connection interrupted. Reloading…"
              : "Something went wrong while loading Echo Speak."}
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
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
