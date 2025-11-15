import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const JackpotCardSkeleton = () => {
  return (
    <Card className="rounded-xl shadow-md overflow-hidden break-inside-avoid mb-3">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>

        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-3/4 mx-auto" />
          <Skeleton className="h-3 w-1/2 mx-auto" />
        </div>

        <div className="rounded-lg p-3 bg-secondary/20">
          <Skeleton className="h-3 w-16 mx-auto mb-1" />
          <Skeleton className="h-7 w-32 mx-auto" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg p-2 bg-secondary/20">
              <Skeleton className="h-3 w-12 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        <Skeleton className="h-9 w-full rounded" />
      </CardContent>
    </Card>
  );
};
