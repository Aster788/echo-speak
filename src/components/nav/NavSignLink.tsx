import Link from "next/link";
import type { MouseEvent } from "react";
import { pageHintFont, pageHintTextClassName } from "@/lib/page-hint-font";

type NavSignLinkProps = {
  href: string;
  label: string;
  active: boolean;
  onActiveClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function NavSignLink({
  href,
  label,
  active,
  onActiveClick,
}: NavSignLinkProps) {
  return (
    <Link
      href={href}
      onClick={active ? onActiveClick : undefined}
      className={`${pageHintFont.className} whitespace-nowrap transition-opacity duration-150 ${pageHintTextClassName} ${
        active
          ? "text-[13px] font-medium"
          : "text-[11px] font-normal opacity-80 hover:opacity-100"
      }`}
    >
      {label}
    </Link>
  );
}
