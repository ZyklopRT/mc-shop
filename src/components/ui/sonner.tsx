"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      visibleToasts={3}
      expand={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!bg-green-400 group-[.toaster]:!text-green-900 group-[.toaster]:!border-green-500",
          error:
            "group-[.toaster]:!bg-red-400 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-500",
          warning:
            "group-[.toaster]:!bg-yellow-400 group-[.toaster]:!text-yellow-900 group-[.toaster]:!border-yellow-500",
          info: "group-[.toaster]:!bg-blue-400 group-[.toaster]:!text-blue-900 group-[.toaster]:!border-blue-500",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
