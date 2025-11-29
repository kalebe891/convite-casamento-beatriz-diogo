import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

export function SkeletonCard({ 
  className, 
  showImage = false,
  lines = 2 
}: SkeletonCardProps) {
  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader className="space-y-3">
        {showImage && (
          <Skeleton className="h-40 w-full rounded-lg" />
        )}
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      {lines > 0 && (
        <CardContent className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
