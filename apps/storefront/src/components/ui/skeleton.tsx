import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200/80", className)}
      {...props}
    />
  );
}

export function ProductSkeleton() {
  return (
    <div className="flex gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between mt-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex gap-2 py-3 px-4 bg-white border-b border-gray-100 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
      ))}
    </div>
  );
}

export { Skeleton };
