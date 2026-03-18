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
      className={`h-auto w-full justify-start px-3 py-2.5 border border-gray-200 rounded-lg ${colorConfig.hover} transition-colors text-left`}
    >
      <div className="flex items-center gap-4">
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
              {" · "}
              {usedOccurrencesCount}{" "}
              {usedOccurrencesCount === 1 ? "cop" : "cops"}
            </p>
          )}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Button>
  );
}

// Component per mostrar un item seleccionable
function ItemButton({ text, onClick, usageCount }) {
  const isUsed = usageCount > 0;

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={`h-auto w-full justify-start px-3 py-2.5 border rounded-lg transition-colors text-left ${
        isUsed
          ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100"
          : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50"
      }`}
    >
      <div className="w-full flex items-start justify-between gap-3">
        <p
          className={`flex-1 ${isUsed ? "text-emerald-900" : "text-gray-700"}`}
        >
          {text}
        </p>
        {isUsed && (
          <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
            {usageCount} {usageCount === 1 ? "cop" : "cops"}
          </span>
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
      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium mb-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
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
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-medium">Nota:</span> Les categories són
            exclusivament per classificar els ítems i no afecten al contingut de
            l'informe generat.
          </p>
        </div>
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
      <div>
        <BackButton onClick={handleBackToCategories}>
          Tornar a categories
        </BackButton>

        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {category.name}
          </h4>
          <p className="text-sm text-gray-500">
            Selecciona l'item que vols afegir al teu informe:
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Els items ja utilitzats apareixen marcats en verd amb el nombre de
            cops.
          </p>
        </div>

        <div className="space-y-2">
          {category.items.map((itemText, index) => (
            <ItemButton
              key={index}
              text={itemText}
              usageCount={itemUsageMap[normalizeItemKey(itemText)] || 0}
              onClick={() => handleItemSelect(selectedCategory, index)}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default CategorySelector;
