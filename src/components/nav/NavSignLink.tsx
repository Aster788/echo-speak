import Link from "next/link";
import type { MouseEvent } from "react";
import { useLinkStatus } from "next/link";
import { pageHintFont, pageHintTextClassName } from "@/lib/page-hint-font";

type NavSignLinkProps = {
  href: string;
  label: string;
  active: boolean;
  onActiveClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function NavLinkLabel({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={`inline-flex items-center transition-opacity duration-100 ${
        pending ? "opacity-35" : ""
      } ${
        active
          ? "text-[13px] font-medium"
          : "text-[11px] font-normal opacity-80 group-hover:opacity-100"
      }`}
    >
      {label}
    </span>
  );
}

export function NavSignLink({
  href,
  label,
  active,
  onActiveClick,
}: NavSignLinkProps) {
  return (
    <Link
      href={href}
      // Avoid racing five route chunks while iOS freezes Chrome mid-prefetch.
      prefetch={false}
      onClick={active ? onActiveClick : undefined}
      className={`group whitespace-nowrap ${pageHintFont.className} ${pageHintTextClassName}`}
    >
      <NavLinkLabel label={label} active={active} />
    </Link>
  );
}
