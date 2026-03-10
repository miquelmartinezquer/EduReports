import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ExportItemsDialog({
  open,
  onOpenChange,
  categoryCount,
  itemCount,
  onExport,
  isExporting,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar Items</DialogTitle>
          <DialogDescription>
            Revisa el resum abans d'exportar els items del curs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-medium text-indigo-700">Categories</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">
              {categoryCount}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">Items totals</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">
              {itemCount}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Tancar
          </Button>
          <Button
            type="button"
            variant="brand"
            onClick={onExport}
            disabled={isExporting || categoryCount === 0}
          >
            {isExporting ? "Exportant..." : "Exportar CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportItemsDialog;
