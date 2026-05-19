export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={
            index + 1 <= current
              ? "h-2.5 w-8 rounded-full bg-teal-700 dark:bg-teal-300"
              : "h-2.5 w-8 rounded-full bg-slate-200 dark:bg-slate-700"
          }
        />
      ))}
    </div>
  );
}
