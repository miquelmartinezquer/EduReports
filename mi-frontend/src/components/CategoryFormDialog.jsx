import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { COLOR_CLASSES } from "../services/colorHelper";

function CategoryFormDialog({
  open,
  onOpenChange,
  title,
  description,
  name,
  onNameChange,
  color,
  onColorChange,
  availableColors,
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="Ex: Motricitat i Moviment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((availableColor) => {
                const bgClass =
                  COLOR_CLASSES[availableColor.key]?.bg || "bg-gray-400";

                return (
                  <button
                    key={availableColor.key}
                    type="button"
                    onClick={() => onColorChange(availableColor.key)}
                    className={`w-10 h-10 rounded-lg transition-opacity hover:opacity-90 ${bgClass} ${
                      color === availableColor.key
                        ? "ring-2 ring-offset-2 ring-indigo-500"
                        : ""
                    }`}
                    title={availableColor.name}
                    aria-label={`Seleccionar color ${availableColor.name}`}
                  />
                );
              })}
            </div>
          </div>
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
            disabled={!name.trim()}
            className="flex-1"
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CategoryFormDialog;
