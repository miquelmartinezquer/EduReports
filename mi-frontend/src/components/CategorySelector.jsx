import React, { useState, useMemo } from "react";
import { COLOR_CLASSES, DEFAULT_COLOR } from "../services/colorHelper";

// Component per mostrar una categoria
function CategoryButton({ categoryKey, category, colorConfig, onClick }) {
  return (
    <button
      onClick={() => onClick(categoryKey)}
      className={`w-full p-4 border border-gray-200 rounded-lg ${colorConfig.hover} transition-colors text-left`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-3 h-12 ${colorConfig.bg} rounded-full shrink-0`}
        ></div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{category.name}</h4>
          <p className="text-sm text-gray-500">
            {category.items.length} items disponibles
          </p>
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
    </button>
  );
}

// Component per mostrar un item seleccionable
function ItemButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
    >
      <p className="text-gray-700">{text}</p>
    </button>
  );
}

// Component botó per tornar enrere
function BackButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
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
    </button>
  );
}

// Component principal del selector de categories
function CategorySelector({
  categoriesData,
  availableColors = [],
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
          {Object.entries(categoriesData).map(([key, category]) => (
            <CategoryButton
              key={key}
              categoryKey={key}
              category={category}
              colorConfig={COLOR_CLASSES[category.color] || DEFAULT_COLOR}
              onClick={handleCategoryClick}
            />
          ))}
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
        </div>

        <div className="space-y-2">
          {category.items.map((itemText, index) => (
            <ItemButton
              key={index}
              text={itemText}
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
