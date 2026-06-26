"use client";

import Image from "next/image";
import type { Expression } from "@/types/expression";

type ExpressionCardProps = {
  expression: Expression;
  fadingOut?: boolean;
  onMove: () => void;
  onDelete: () => void;
};

export function ExpressionCard({
  expression,
  fadingOut = false,
  onMove,
  onDelete,
}: ExpressionCardProps) {
  const hasPhrase = expression.phrase.trim().length > 0;

  return (
    <article
      className={`relative border-[7px] border-dashed border-[#050505] bg-[#FFFFFF] py-3 pl-4 pr-2 transition-opacity duration-200 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="space-y-1.5 text-[#222222]">
        {hasPhrase ? (
          <>
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug">
                {expression.phrase}
              </h3>
              <ExpressionCardActions onMove={onMove} onDelete={onDelete} />
            </div>
            {expression.meaning && (
              <p className="text-[0.8125rem] leading-snug">
                {expression.meaning}
              </p>
            )}
            {expression.example_en && (
              <p className="text-[0.8125rem] italic leading-snug opacity-85">
                {expression.example_en}
              </p>
            )}
            {expression.example_zh && (
              <p className="text-[0.8125rem] leading-snug opacity-85">
                {expression.example_zh}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <ExpressionCardActions onMove={onMove} onDelete={onDelete} />
            </div>
            {expression.example_en && (
              <p className="text-[0.8125rem] italic leading-snug">
                {expression.example_en}
              </p>
            )}
            {expression.example_zh && (
              <p className="text-[0.8125rem] leading-snug">
                {expression.example_zh}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

function ExpressionCardActions({
  onMove,
  onDelete,
}: Pick<ExpressionCardProps, "onMove" | "onDelete">) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onMove}
        className="p-0.5 transition-opacity duration-150 active:opacity-70"
        aria-label="Move expression"
      >
        <Image
          src="/collections/move.png"
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] object-contain"
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-0.5 transition-opacity duration-150 active:opacity-70"
        aria-label="Delete expression"
      >
        <Image
          src="/collections/bin.png"
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] object-contain"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
