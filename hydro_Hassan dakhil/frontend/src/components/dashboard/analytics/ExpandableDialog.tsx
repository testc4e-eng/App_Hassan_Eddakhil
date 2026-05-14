import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExpandableDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function ExpandableDialog({
  open,
  onOpenChange,
  title,
  children,
}: ExpandableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] max-h-[90vh] overflow-auto p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
