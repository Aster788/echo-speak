import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  PAGE_FLAG_ASPECT_RATIO,
  PAGE_FLAG_DISPLAY_WIDTH,
} from "@/lib/import-notebook-layout";

type PageFlagButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PageFlagButton({
  children,
  className = "",
  type = "button",
  ...props
}: PageFlagButtonProps) {
  return (
    <button
      type={type}
      className={`relative flex shrink-0 items-center justify-center border-0 bg-transparent bg-[length:100%_100%] bg-center bg-no-repeat p-0 font-normal italic tracking-wide text-[#222222] transition-opacity duration-150 active:opacity-80 disabled:opacity-60 ${className}`}
      style={{
        width: PAGE_FLAG_DISPLAY_WIDTH,
        aspectRatio: String(PAGE_FLAG_ASPECT_RATIO),
        backgroundImage: "url(/import/page-flag.png)",
      }}
      {...props}
    >
      <span className="relative z-10 px-3 pt-0.5 text-base">{children}</span>
    </button>
  );
}
