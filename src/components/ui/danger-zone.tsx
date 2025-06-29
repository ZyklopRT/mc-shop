import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DangerZoneProps {
  title?: string;
  description?: string;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  itemName?: string;
}

export function DangerZone({
  title = "Danger Zone",
  description = "Irreversible and destructive actions",
  buttonText = "Delete",
  dialogTitle = "Confirm Deletion",
  dialogDescription = "Are you sure you want to delete this item? This action cannot be undone.",
  onConfirm,
  isLoading = false,
  disabled = false,
  itemName,
}: DangerZoneProps) {
  const enhancedDialogDescription = itemName
    ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    : dialogDescription;

  return (
    <Card className="border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-red-700/80 dark:text-red-300/80">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={disabled || isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600 dark:text-red-400">
                {dialogTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {enhancedDialogDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isLoading ? "Deleting..." : buttonText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
