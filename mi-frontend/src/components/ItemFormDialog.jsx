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
  variants = [],
  variantDraft = "",
  onVariantDraftChange,
  onAddVariant,
  onRemoveVariant,
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
            Títol de la rubrica
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="Ex: Interès a l'activitat"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Avaluacions{" "}
            <span className="text-red-500 font-semibold">*</span>
            <span className="text-xs text-gray-400 font-normal ml-1">
              (cal almenys Av1)
            </span>
          </label>

          {variants.length > 0 ? (
            <div className="flex flex-col gap-1.5 mb-3">
              {variants.map((variant, idx) => (
                <div
                  key={variant}
                  className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs font-bold text-indigo-600 shrink-0 w-8">
                    Av{idx + 1}
                    {idx === 0 && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">{variant}</span>
                  <button
                    type="button"
                    className="text-indigo-400 hover:text-red-600 transition-colors"
                    onClick={() => onRemoveVariant?.(variant)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              Cal afegir almenys Av1 per poder desar la rubrica.
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={variantDraft}
              onChange={(e) => onVariantDraftChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddVariant?.();
                }
              }}
              placeholder={
                variants.length === 0
                  ? "Av1*: Ex: Mostra interès per l'activitat"
                  : `Av${variants.length + 1}: Ex: Treballa amb autonomia`
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <Button type="button" variant="outline" onClick={onAddVariant}>
              Afegir
            </Button>
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
            disabled={!value.trim() || variants.length === 0}
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
