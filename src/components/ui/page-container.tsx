import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  size?: "small" | "medium" | "large" | "full";
  className?: string;
}

const sizeClasses = {
  small: "max-w-lg",
  medium: "max-w-2xl",
  large: "max-w-5xl",
  full: "max-w-7xl",
} as const;

export function PageContainer({
  children,
  size = "full",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-4 py-8 sm:px-6 lg:px-8",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
