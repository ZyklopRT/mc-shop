import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface NavigationContainerProps {
  children: ReactNode;
  className?: string;
}

export function NavigationContainer({
  children,
  className,
}: NavigationContainerProps) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
