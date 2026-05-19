"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CircleDollarSign, FileUp, Gavel, UsersRound, Vote } from "lucide-react";

const steps = [
  {
    label: "Claim submitted",
    description: "A structured packet enters the carrier policy pool with evidence, codes, and requested payout.",
    icon: FileUp
  },
  {
    label: "Verifier review",
    description: "Credentialed reviewers inspect the same packet your team would see, with conflicts surfaced early.",
    icon: UsersRound
  },
  {
    label: "Private vote",
    description: "Reviewers commit their decision first, then reveal it after the window closes to reduce herd bias.",
    icon: Vote
  },
  {
    label: "Resolve",
    description: "The protocol calculates the outcome, records the audit trail, and updates reviewer accuracy.",
    icon: CheckCircle2
  },
  {
    label: "Optional appeal",
    description: "Edge cases can escalate to a second look without forcing every claim into a manual queue.",
    icon: Gavel
  },
  {
    label: "Carrier reserve payout",
    description: "Approved or partial outcomes release from the carrier-funded reserve with a visible transaction trail.",
    icon: CircleDollarSign
  }
];

export function HowItWorksFlow() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-base font-semibold">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
