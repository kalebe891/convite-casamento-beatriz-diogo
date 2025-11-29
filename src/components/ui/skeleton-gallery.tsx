import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonGalleryProps {
  className?: string;
  columns?: 2 | 3 | 4;
  items?: number;
}

export function SkeletonGallery({ 
  className, 
  columns = 4,
  items = 8 
}: SkeletonGalleryProps) {
  const gridClasses = {
    2: "grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return (
    <div className={cn(
      "grid grid-cols-2 gap-4",
      gridClasses[columns],
      className
    )}>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton 
          key={i}
          className="aspect-square rounded-lg animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}
