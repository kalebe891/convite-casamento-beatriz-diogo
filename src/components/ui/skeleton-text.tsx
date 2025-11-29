import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonTextProps {
  className?: string;
  lines?: number;
  variant?: "heading" | "title" | "body" | "caption";
}

export function SkeletonText({ 
  className, 
  lines = 1,
  variant = "body" 
}: SkeletonTextProps) {
  const variantClasses = {
    heading: "h-12 w-3/4",
    title: "h-8 w-2/3",
    body: "h-5 w-full",
    caption: "h-4 w-1/2",
  };

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i}
          className={cn(
            variantClasses[variant],
            i === lines - 1 && lines > 1 && "w-5/6"
          )}
        />
      ))}
    </div>
  );
}
