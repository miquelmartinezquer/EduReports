import React from "react";
import { Button } from "./ui/button";
import CategorySelector from "./CategorySelector";

function ItemSelectorModal({
  isOpen,
  onClose,
  categoriesData,
  availableColors,
  itemUsageMap,
  onSelectItem,
  onRemoveItem,
  sectionTitle,
  sectionItemCount = 0,
}) {
  const handleAddItem = (itemText, categoryName, responseOptions = []) => {
    // Afegir l'item directament sense tancar el modal
    onSelectItem(itemText, categoryName, responseOptions);
  };

  const handleRemoveItem = (itemText) => {
    // Eliminar l'item
    onRemoveItem(itemText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">
              Selecciona rubriques d'avaluacio
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Clica sobre les rubriques per afegir-les a l'apartat
            </p>
            {sectionTitle && (
              <p className="text-indigo-600 text-sm font-medium mt-2 flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Apartat: {sectionTitle}
                <span className="ml-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {sectionItemCount} {sectionItemCount === 1 ? "rubrica" : "rubriques"}
                </span>
              </p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon-sm"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <CategorySelector
            categoriesData={categoriesData}
            availableColors={availableColors}
            itemUsageMap={itemUsageMap}
            onSelectItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </div>
  );
}

export default ItemSelectorModal;
