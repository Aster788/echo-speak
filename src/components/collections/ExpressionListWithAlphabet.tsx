"use client";

import { useState } from "react";
import { ExpressionCard } from "@/components/collections/ExpressionCard";
import { pageHintFont } from "@/lib/page-hint-font";
import type { Expression } from "@/types/expression";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

type ExpressionListWithAlphabetProps = {
  expressions: Expression[];
  fadingIds: Set<string>;
  scopeId: string;
  onMove: (expressionId: string) => void;
  onDelete: (expressionId: string) => void;
};

function expressionLetter(expression: Expression): string | null {
  const value = (expression.phrase || expression.example_en).trim();
  const letter = value[0]?.toLowerCase();
  return letter && /^[a-z]$/.test(letter) ? letter : null;
}

export function ExpressionListWithAlphabet({
  expressions,
  fadingIds,
  scopeId,
  onMove,
  onDelete,
}: ExpressionListWithAlphabetProps) {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const availableLetters = new Set(
    expressions.map(expressionLetter).filter((letter): letter is string => Boolean(letter))
  );
  const navLetters = LETTERS.filter((letter) => availableLetters.has(letter));
  const seenLetters = new Set<string>();

  function jumpToLetter(letter: string) {
    setActiveLetter(letter);
    document
      .getElementById(`${scopeId}-${letter}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex items-start gap-1">
      <div className="min-w-0 flex-1 space-y-2">
        {expressions.map((expression) => {
          const letter = expressionLetter(expression);
          const anchorId =
            letter && !seenLetters.has(letter) ? `${scopeId}-${letter}` : undefined;
          if (letter) {
            seenLetters.add(letter);
          }

          return (
            <div key={expression.id} id={anchorId} className="scroll-mt-3">
              <ExpressionCard
                expression={expression}
                fadingOut={fadingIds.has(expression.id)}
                onMove={() => onMove(expression.id)}
                onDelete={() => onDelete(expression.id)}
              />
            </div>
          );
        })}
      </div>
      {navLetters.length > 0 ? (
        <nav
          aria-label="Jump to expression letter"
          className={`sticky top-2 flex w-5 shrink-0 flex-col items-center gap-1 text-[10.5px] font-normal leading-none tracking-[0.01em] ${pageHintFont.className}`}
        >
          {navLetters.map((letter) => {
            const isActive = activeLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => jumpToLetter(letter)}
                className={`h-[14px] w-5 rounded-sm transition-[transform,color,filter] duration-150 hover:z-10 hover:-translate-y-0.5 hover:drop-shadow-[0_2px_4px_rgba(34,34,34,0.35)] ${
                  isActive ? "text-[#222222]" : "text-[#222222]/55"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
