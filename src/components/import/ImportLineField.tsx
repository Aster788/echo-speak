import { pageHintFont } from "@/lib/page-hint-font";
import type { InputHTMLAttributes, ReactNode } from "react";
import {
  NOTEBOOK_ROW_HEIGHT,
  notebookInputClassName,
  notebookLabelClassName,
  notebookRowBorderClassName,
} from "@/lib/import-notebook-layout";

type ImportLineFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
};

export function ImportLineField({
  label,
  id,
  className = "",
  ...inputProps
}: ImportLineFieldProps) {
  return (
    <div className="mb-2 shrink-0">
      <label
        htmlFor={id}
        className={`${pageHintFont.className} ${notebookLabelClassName} mb-0.5`}
      >
        {label}
      </label>
      <div
        className={`w-full ${notebookRowBorderClassName}`}
        style={{ height: NOTEBOOK_ROW_HEIGHT }}
      >
        <input
          id={id}
          className={`block h-full w-full ${notebookInputClassName} ${className}`}
          style={{ lineHeight: `${NOTEBOOK_ROW_HEIGHT}px` }}
          {...inputProps}
        />
      </div>
    </div>
  );
}
