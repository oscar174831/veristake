"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { VoteChoice } from "@/lib/scenarios";

const choices: VoteChoice[] = ["APPROVE", "PARTIAL", "DENY"];

const descriptions: Record<VoteChoice, string> = {
  APPROVE: "Evidence supports paying the claim.",
  PARTIAL: "Pay part of the request because the evidence supports less than the full amount.",
  DENY: "Evidence supports rejecting the claim."
};

export function VoteWidget({
  expected,
  onVote
}: {
  expected: VoteChoice;
  onVote: (choice: VoteChoice, correct: boolean) => void;
}) {
  const [choice, setChoice] = useState<VoteChoice | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold">Your review decision</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Choose the business outcome you would recommend after reviewing the packet.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {choices.map((item) => (
          <Button
            key={item}
            aria-label={item}
            variant={choice === item ? "primary" : "secondary"}
            className="min-h-20 flex-col items-start text-left"
            onClick={() => {
              setChoice(item);
              onVote(item, item === expected);
            }}
          >
            <span>{item}</span>
            <span className="text-xs font-normal opacity-80">{descriptions[item]}</span>
          </Button>
        ))}
      </div>
      {choice ? (
        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          Recorded: {descriptions[choice]}
        </p>
      ) : null}
    </div>
  );
}
