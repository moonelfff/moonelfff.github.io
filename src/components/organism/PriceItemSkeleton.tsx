import { Skeleton, SkeletonText } from "../atom/Skeleton";
import Card from "../molecule/Card";

function PriceItemSkeleton() {
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-1/2" />
        <SkeletonText lines={5} />
      </div>
      <div className="flex flex-col gap-3 pt-6">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default PriceItemSkeleton;
