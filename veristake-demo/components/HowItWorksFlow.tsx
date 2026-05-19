"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CircleDollarSign, FileUp, Gavel, UsersRound, Vote } from "lucide-react";

const steps = [
  { label: "Claim submitted", icon: FileUp },
  { label: "Verifier review", icon: UsersRound },
  { label: "Private vote", icon: Vote },
  { label: "Resolve", icon: CheckCircle2 },
  { label: "Optional appeal", icon: Gavel },
  { label: "Carrier reserve payout", icon: CircleDollarSign }
];

export function HowItWorksFlow() {
  return (
    <div className="grid gap-3 md:grid-cols-6">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <motion.div
            key={step.label}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-200">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold">{step.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
