import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ItemFormDialog({
  open,
  onOpenChange,
  title,
  description,
  value,
  onValueChange,
  onSubmit,
  submitLabel,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text de l'item
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="Ex: Mostra interès per l'activitat"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel·lar
          </Button>
          <Button
            onClick={onSubmit}
            variant="brand"
            disabled={!value.trim()}
            className="flex-1"
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ItemFormDialog;
