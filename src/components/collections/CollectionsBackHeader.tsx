"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type CollectionsBackHeaderProps = {
  title: ReactNode;
  onBack: () => void;
  /** Optional action centered between title and back (e.g. Re-extract). */
  center?: ReactNode;
};

export function CollectionsBackHeader({
  title,
  onBack,
  center,
}: CollectionsBackHeaderProps) {
  return (
    <div className="mb-4 flex min-h-[33px] items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center text-[#222222]">
        {title}
      </div>
      {center ? <div className="shrink-0">{center}</div> : null}
      <button
        type="button"
        onClick={onBack}
        className="flex shrink-0 items-center p-1 transition-opacity duration-150 active:opacity-70"
        aria-label="Back"
      >
        <Image
          src="/collections/back.png"
          alt=""
          width={28}
          height={25}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
