import { cn } from "@/lib/utils";

/**
 * Skeleton.tsx - Reusable skeleton loader components for premium content-first loading.
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60 shimmer", className)}
      {...props}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-border/40">
      <Skeleton className="h-48 sm:h-56 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/4 rounded-lg" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="pt-4 border-t border-border/40 flex justify-between items-center">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MenuCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-border/40 shadow-soft">
      <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
      <div className="flex-1 space-y-3 py-1">
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
