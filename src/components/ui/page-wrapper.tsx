import * as React from "react";
import { cn } from "~/lib/utils";

interface PageWrapperProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({
  children,
  className,
  ...props
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
