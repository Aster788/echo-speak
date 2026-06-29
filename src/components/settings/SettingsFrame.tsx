"use client";

import type { ReactNode } from "react";
import {
  SETTINGS_FRAME_HEIGHT,
  SETTINGS_FRAME_INSET_CLASS,
} from "@/lib/settings-layout";

const FRAME_SRC = "/settings/frame.png";

type SettingsFrameProps = {
  height?: number;
  children: ReactNode;
  className?: string;
};

export function SettingsFrame({
  height = SETTINGS_FRAME_HEIGHT,
  children,
  className = "",
}: SettingsFrameProps) {
  return (
    <div className="relative w-full shrink-0" style={{ height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={FRAME_SRC}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        aria-hidden="true"
      />
      <div
        className={`relative z-10 flex h-full min-w-0 items-center ${SETTINGS_FRAME_INSET_CLASS} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
