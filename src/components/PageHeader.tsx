"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  pageHintColumnClassName,
  pageHintColumnWidthVar,
} from "@/lib/page-hint-column";
import { pageHintFont, pageHintTextClassName } from "@/lib/page-hint-font";

const PAGE_HINT_MAX_PX = 17;
const PAGE_HINT_MIN_PX = 11;

type PageHeaderProps = {
  description?: string;
};

function PageHeaderDivider() {
  return (
    <div className="mt-1.5 flex w-full items-center gap-2" aria-hidden="true">
      <span className="h-px min-w-0 flex-1 bg-[#222222]" />
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        className="shrink-0 text-[#222222]"
      >
        <path
          d="M5 0 6.15 3.85H10L7 6.15 8.15 10 5 7.65 1.85 10 3 6.15 0 3.85H3.85L5 0Z"
          fill="currentColor"
        />
      </svg>
      <span className="h-px min-w-0 flex-1 bg-[#222222]" />
    </div>
  );
}

function fitPageHintFontSize(textEl: HTMLElement, maxWidth: number): number {
  let size = PAGE_HINT_MAX_PX;
  textEl.style.fontSize = `${size}px`;

  while (textEl.scrollWidth > maxWidth && size > PAGE_HINT_MIN_PX) {
    size -= 0.5;
    textEl.style.fontSize = `${size}px`;
  }

  return size;
}

function estimateInitialFontSize(text: string): number {
  if (text.length > 52) return 12;
  if (text.length > 42) return 14;
  return PAGE_HINT_MAX_PX;
}

export function PageHeader({ description }: PageHeaderProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [fontSizePx, setFontSizePx] = useState(() =>
    description ? estimateInitialFontSize(description) : PAGE_HINT_MAX_PX
  );

  useLayoutEffect(() => {
    const measure = measureRef.current;
    const text = textRef.current;
    if (!measure || !text || !description) return;

    const apply = () => {
      const maxWidth = measure.clientWidth;
      if (maxWidth === 0) return;
      setFontSizePx(fitPageHintFontSize(text, maxWidth));

      const column = columnRef.current;
      const root = column?.closest("main") ?? document.documentElement;
      if (column) {
        root.style.setProperty(
          pageHintColumnWidthVar,
          `${column.offsetWidth}px`
        );
      }
    };

    apply();
    void document.fonts?.ready.then(apply);

    const observer = new ResizeObserver(apply);
    observer.observe(measure);
    if (columnRef.current) {
      observer.observe(columnRef.current);
    }
    return () => observer.disconnect();
  }, [description]);

  if (!description) return null;

  return (
    <header className={`${pageHintFont.className} mb-2`}>
      <div ref={measureRef} className="w-full min-w-0">
        <div ref={columnRef} className={pageHintColumnClassName}>
          <p
            ref={textRef}
            style={{ fontSize: `${fontSizePx}px` }}
            className={`whitespace-nowrap text-center leading-snug ${pageHintTextClassName}`}
          >
            {description}
          </p>
          <PageHeaderDivider />
        </div>
      </div>
    </header>
  );
}
