import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonImageProps {
  className?: string;
  aspectRatio?: "square" | "video" | "hero";
}

export function SkeletonImage({ className, aspectRatio = "video" }: SkeletonImageProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    hero: "aspect-[21/9]",
  };

  return (
    <Skeleton 
      className={cn(
        "w-full rounded-lg",
        aspectClasses[aspectRatio],
        className
      )} 
    />
  );
}
