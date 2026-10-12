import { Skeleton } from "@/components/atom/Skeleton";

function CardSkeleton({ fields }: { fields: number }) {
  return (
    <div className="border-alabaster-grey bg-platinum flex flex-col gap-4 rounded-2xl border p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <Skeleton className="h-11 w-28 shrink-0" />
      </div>
      {Array.from({ length: fields }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Placeholder shown while an admin page loads its data. */
export function AdminPageSkeleton() {
  return (
    <div className="text-dusty-grape flex flex-col gap-4" role="status" aria-label="Загрузка">
      <CardSkeleton fields={3} />
      <CardSkeleton fields={2} />
      <CardSkeleton fields={2} />
    </div>
  );
}
