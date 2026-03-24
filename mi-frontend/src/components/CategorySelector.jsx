import React, { useState } from "react";
import { COLOR_CLASSES, DEFAULT_COLOR } from "../services/colorHelper";
import { Button } from "@/components/ui/button";

const normalizeItemKey = (text) =>
  String(text || "")
    .trim()
    .toLowerCase();

// Component per mostrar una categoria
function CategoryButton({
  categoryKey,
  category,
  colorConfig,
  onClick,
  usedItemsCount,
  usedOccurrencesCount,
}) {
  return (
    <Button
      onClick={() => onClick(categoryKey)}
      variant="outline"
      className={`h-auto w-full justify-between px-3 py-2.5 border border-gray-200 rounded-lg ${colorConfig.hover} transition-colors text-left`}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          className={`w-3 h-9 ${colorConfig.bg} rounded-full shrink-0`}
        ></div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{category.name}</h4>
          <p className="text-sm text-gray-500">
            {category.items.length} items disponibles
          </p>
          {usedItemsCount > 0 && (
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              {usedItemsCount}{" "}
              {usedItemsCount === 1 ? "item utilitzat" : "items utilitzats"}
            </p>
          )}
        </div>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-gray-400 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Button>
  );
}

// Component per mostrar un item seleccionable
function ItemButton({ text, onClick, onRemove, usageCount }) {
  const isUsed = usageCount > 0;

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove(text);
  };

  const handleClick = (e) => {
    if (!isUsed) {
      onClick(e);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`h-auto w-full justify-start px-3 py-2.5 border rounded-lg transition-colors text-left ${
        isUsed
          ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 cursor-not-allowed opacity-70"
          : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50"
      }`}
      title={isUsed ? "Aquest item ja està utilitzat a l'informe" : undefined}
    >
      <div className="w-full flex items-start justify-between gap-3">
        <p
          className={`flex-1 overflow-hidden text-ellipsis line-clamp-3 ${isUsed ? "text-emerald-900" : "text-gray-700"}`}
        >
          {text}
        </p>
        {isUsed && (
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
              Utilitzat
            </span>
            <button
              onClick={handleRemoveClick}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded transition-colors cursor-pointer"
              title="Eliminar item de l'informe"
              type="button"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </Button>
  );
}

// Component botó per tornar enrere
function BackButton({ onClick, children }) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium text-sm py-1.5 px-2 h-auto bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white"
    >
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
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {children}
    </Button>
  );
}

// Component principal del selector de categories
function CategorySelector({
  categoriesData,
  availableColors = [],
  itemUsageMap = {},
  onSelectItem,
  onRemoveItem,
}) {
  const [view, setView] = useState("categories"); // 'categories', 'items'
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setView("items");
  };

  const handleBackToCategories = () => {
    setView("categories");
    setSelectedCategory(null);
  };

  const handleItemSelect = (categoryKey, itemIndex) => {
    const category = categoriesData[categoryKey];
    const itemText = category.items[itemIndex];
    onSelectItem(itemText, category.name);
  };

  // Vista de categories
  if (view === "categories") {
    return (
      <div>
        <div className="space-y-3">
          {Object.entries(categoriesData).map(([key, category]) =>
            (() => {
              const usageByItem = Array.isArray(category.items)
                ? category.items.map(
                    (itemText) => itemUsageMap[normalizeItemKey(itemText)] || 0,
                  )
                : [];

              const usedItemsCount = usageByItem.filter(
                (count) => count > 0,
              ).length;
              const usedOccurrencesCount = usageByItem.reduce(
                (acc, count) => acc + count,
                0,
              );

              return (
                <CategoryButton
                  key={key}
                  categoryKey={key}
                  category={category}
                  colorConfig={COLOR_CLASSES[category.color] || DEFAULT_COLOR}
                  usedItemsCount={usedItemsCount}
                  usedOccurrencesCount={usedOccurrencesCount}
                  onClick={handleCategoryClick}
                />
              );
            })(),
          )}
        </div>
      </div>
    );
  }

  // Vista d'items d'una categoria
  if (view === "items" && selectedCategory) {
    const category = categoriesData[selectedCategory];

    return (
      <div className="relative">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {category.name}
          </h4>
          <p className="text-sm text-gray-500">
            Clica sobre un item per afegir-lo a l'informe
          </p>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-emerald-700">
              {
                category.items.filter((itemText) => {
                  const normalizedKey = String(itemText || "")
                    .trim()
                    .toLowerCase();
                  return itemUsageMap[normalizedKey] > 0;
                }).length
              }{" "}
              items utilitzats
            </p>
          </div>
        </div>

        {/* Botó sticky que es manté visible al fer scroll */}
        <div className="sticky top-0 left-0 z-10 pb-2 -mx-6 px-6">
          <BackButton onClick={handleBackToCategories}>
            Tornar a categories
          </BackButton>
        </div>

        <div className="space-y-2">
          {category.items.map((itemText, index) => (
            <ItemButton
              key={index}
              text={itemText}
              usageCount={itemUsageMap[normalizeItemKey(itemText)] || 0}
              onClick={() => handleItemSelect(selectedCategory, index)}
              onRemove={onRemoveItem}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default CategorySelector;
