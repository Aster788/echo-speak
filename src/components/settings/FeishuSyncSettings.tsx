"use client";

import { useState, useTransition } from "react";
import { runFeishuSyncManual } from "@/app/feishu/actions";

export function FeishuSyncSettings() {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSync(full = false) {
    startTransition(async () => {
      const result = await runFeishuSyncManual(full ? "full" : "incremental");
      setMessage(result.ok ? result.summary : result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.75rem] leading-snug text-[#222222]/80">
        Sync notes from Feishu into your expression library. Home also syncs
        automatically when stale.
      </p>
      <div className="flex w-full gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => handleSync(false)}
          className="min-w-0 flex-1 rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
        >
          Sync now
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => handleSync(true)}
          className="min-w-0 flex-1 rounded-[1rem] border-[2.5px] border-[#D4D4D4] px-4 py-2.5 text-center text-[0.8125rem] font-medium text-[#222222] transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
        >
          Sync all
        </button>
      </div>
      {message ? (
        <p className="text-center text-[0.75rem] text-[#222222]/80">{message}</p>
      ) : null}
    </div>
  );
}
