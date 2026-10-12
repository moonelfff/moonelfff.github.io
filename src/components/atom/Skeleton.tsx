type SkeletonProps = {
  className?: string;
};

/** Placeholder block in the theme color; size it with className. */
export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`bg-dusty-grape/10 rounded-lg motion-safe:animate-pulse ${className}`}
    />
  );
}

const LINE_WIDTHS = ["w-full", "w-11/12", "w-full", "w-4/5", "w-2/3"];

/** Several text lines of varying width; the last one is shorter. */
export function SkeletonText({ lines = 4 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2.5" role="status" aria-label="Загрузка">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 ? "w-2/3" : LINE_WIDTHS[index % LINE_WIDTHS.length]}`}
        />
      ))}
    </div>
  );
}
