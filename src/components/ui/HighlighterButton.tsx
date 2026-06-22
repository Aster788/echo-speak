import type { ButtonHTMLAttributes, ReactNode } from "react";
import { highlightSurfaceClassName } from "@/lib/highlight-surface";

type HighlighterButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "pill" | "marker";
  size?: "md" | "sm";
};

export function HighlighterButton({
  children,
  variant = "marker",
  size = "md",
  className = "",
  type = "button",
  ...props
}: HighlighterButtonProps) {
  const sizeClassName =
    size === "sm"
      ? "px-4 py-2 text-sm tracking-wide"
      : "px-6 py-2.5 text-base tracking-[0.08em]";

  const shapeClassName =
    variant === "pill"
      ? "rounded-full"
      : "rounded-[2rem_1.25rem_1.75rem_1.5rem]";

  return (
    <button
      type={type}
      className={`relative w-full font-normal text-[#222222] transition-opacity duration-150 active:opacity-80 disabled:opacity-60 ${shapeClassName} ${sizeClassName} ${highlightSurfaceClassName} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === "marker" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[2px] rounded-[inherit] border border-[#222222]/8"
        />
      )}
    </button>
  );
}
