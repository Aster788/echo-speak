"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type CollectionsBackHeaderProps = {
  title: ReactNode;
  onBack: () => void;
};

export function CollectionsBackHeader({
  title,
  onBack,
}: CollectionsBackHeaderProps) {
  return (
    <div className="mb-4 flex min-h-[33px] items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center text-[#222222]">
        {title}
      </div>
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
