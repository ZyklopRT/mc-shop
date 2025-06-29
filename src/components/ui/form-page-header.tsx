import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

interface FormPageHeaderProps {
  backHref: string;
  backText: string;
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  statusIndicator?: ReactNode;
}

export function FormPageHeader({
  backHref,
  backText,
  icon,
  title,
  description,
  actions,
  statusIndicator,
}: FormPageHeaderProps) {
  return (
    <div className="mb-8">
      <Button variant="outline" asChild className="mb-4">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backText}
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{title}</h1>
              {statusIndicator && statusIndicator}
            </div>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
