"use client";

import Image from "next/image";
import type { Expression, ExpressionExample } from "@/types/expression";

type ExpressionCardProps = {
  expression: Expression;
  onMove: () => void;
  onDelete: () => void;
  onMerge?: () => void;
};

const ORDINAL_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

function ordinalLabel(index: number): string {
  return ORDINAL_WORDS[index] ?? String(index + 1);
}

function collectExamples(expression: Expression): ExpressionExample[] {
  if (expression.examples && expression.examples.length > 0) {
    return expression.examples;
  }
  return [{ en: expression.example_en, zh: expression.example_zh }];
}

export function ExpressionCard({
  expression,
  onMove,
  onDelete,
  onMerge,
}: ExpressionCardProps) {
  const hasPhrase = expression.phrase.trim().length > 0;
  const examples = collectExamples(expression);
  const isMulti = examples.length > 1;

  return (
    <article className="relative border-[7px] border-dashed border-[#050505] bg-[#FFFFFF] py-3 pl-4 pr-2">
      <div className="space-y-1.5 text-[#222222]">
        {hasPhrase ? (
          <>
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 text-[0.9375rem] font-medium leading-snug">
                {expression.phrase}
              </h3>
              <ExpressionCardActions
                onMove={onMove}
                onDelete={onDelete}
                onMerge={onMerge}
              />
            </div>
            {expression.meaning && (
              <p className="text-[0.8125rem] leading-snug">
                {expression.meaning}
              </p>
            )}
            <ExampleBlocks examples={examples} multi={isMulti} />
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <ExpressionCardActions
                onMove={onMove}
                onDelete={onDelete}
                onMerge={onMerge}
              />
            </div>
            <ExampleBlocks examples={examples} multi={isMulti} />
          </>
        )}
      </div>
    </article>
  );
}

function ExampleBlocks({
  examples,
  multi,
}: {
  examples: ExpressionExample[];
  multi: boolean;
}) {
  return (
    <>
      {examples.map((example, index) => (
        <div key={index} className="space-y-0.5">
          {multi && (
            <p className="text-[0.6875rem] font-medium uppercase tracking-wide opacity-60">
              Example {ordinalLabel(index)}
            </p>
          )}
          {example.en && (
            <p className="text-[0.8125rem] italic leading-snug opacity-85">
              {example.en}
            </p>
          )}
          {example.zh && (
            <p className="text-[0.8125rem] leading-snug opacity-85">
              {example.zh}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

function ExpressionCardActions({
  onMove,
  onDelete,
  onMerge,
}: Pick<ExpressionCardProps, "onMove" | "onDelete" | "onMerge">) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {onMerge && (
        <button
          type="button"
          onClick={onMerge}
          className="p-0.5 transition-opacity duration-150 active:opacity-70"
          aria-label="Merge with another expression"
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
      )}
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
