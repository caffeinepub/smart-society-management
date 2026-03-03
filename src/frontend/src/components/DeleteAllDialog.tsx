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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteAllDialogProps {
  /** Label on the trigger button, e.g. "Delete All Bills" */
  label?: string;
  /** Description shown in the confirmation dialog */
  description?: string;
  /** Called when user confirms */
  onConfirm: () => void;
  /** data-ocid scope prefix, e.g. "bills" */
  ocidScope: string;
}

export function DeleteAllDialog({
  label = "Delete All",
  description = "Are you sure you want to delete all records? This action cannot be undone.",
  onConfirm,
  ocidScope,
}: DeleteAllDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 font-body border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          data-ocid={`${ocidScope}.delete_all_button`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            Delete All Records?
          </AlertDialogTitle>
          <AlertDialogDescription className="font-body">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="font-body"
            data-ocid={`${ocidScope}.delete_all_cancel_button`}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="font-body bg-red-600 hover:bg-red-700 text-white"
            onClick={onConfirm}
            data-ocid={`${ocidScope}.delete_all_confirm_button`}
          >
            Delete All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
