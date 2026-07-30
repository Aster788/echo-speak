"use client";

import { useEffect } from "react";
import {
  markReloadAttempt,
  reloadOnceForRecoverableError,
  shouldAutoReloadNow,
} from "@/lib/client-recovery";

/**
 * Catches aborted chunk/RSC loads after iOS Chrome freezes the tab, then
 * hard-reloads once so the user does not see the generic Application error.
 * Pair with the inline boot script in root layout (registers even earlier).
 */
export function ClientRecovery() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reloadOnceForRecoverableError(
        event.message,
        event.error instanceof Error ? event.error.name : null
      );
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : String(reason ?? "");
      const name = reason instanceof Error ? reason.name : null;
      if (reloadOnceForRecoverableError(message, name)) {
        event.preventDefault();
      }
    }

    function onPageShow(event: PageTransitionEvent) {
      // BFCache restore can leave App Router in a dead state.
      if (event.persisted && shouldAutoReloadNow()) {
        markReloadAttempt();
        window.location.reload();
      }
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
