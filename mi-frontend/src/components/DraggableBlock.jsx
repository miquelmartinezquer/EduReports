import React from "react";
import RemoveButton from "./RemoveButton";

const BLOCK_CONFIGS = {
  header: {
    label: "Apartat",
    borderColor: "border-indigo-200",
    labelColor: "text-indigo-600",
    focusRing: "focus:ring-indigo-500 focus:border-indigo-500",
    inputType: "input",
    placeholder: "Escriu el títol de l'apartat...",
  },
  item: {
    label: "Item",
    borderColor: "border-gray-200",
    labelColor: "text-emerald-600",
    focusRing: "focus:ring-emerald-500 focus:border-emerald-500",
    inputType: "input",
    placeholder: "Escriu el contingut d'aquest item...",
  },
};

function DraggableBlock({
  element,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onContentChange,
  onRemove,
  itemCount,
  isExpanded,
  onToggle,
  sectionNumber,
}) {
  const config = BLOCK_CONFIGS[element.type] || BLOCK_CONFIGS.item;
  const isHeader = element.type === "header";

  const handleDragStart = (e) => {
    // Evitar drag si s'està interactuant amb un input o textarea
    const target = e.target;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("input, textarea")
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    onDragStart(e, element);
  };

  const handleContainerClick = (e) => {
    // Només activar toggle si és un header i té onToggle
    if (!isHeader || !onToggle) return;

    // No activar si es clica en input, textarea, botó de remove o drag handle
    const target = e.target;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("input, textarea, button, [draggable='true']")
    ) {
      return;
    }

    onToggle();
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, element)}
      onClick={handleContainerClick}
      className={`bg-white border-2 ${config.borderColor} rounded-lg p-3 hover:shadow-md transition-shadow ${isHeader && onToggle ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Section number - només per headers */}
        {isHeader && sectionNumber !== undefined && (
          <span className="flex items-center justify-center w-7 h-7 bg-indigo-600 text-white text-sm font-bold rounded-md shrink-0 mt-1.5">
            {sectionNumber}
          </span>
        )}

        {/* Toggle button - només per headers */}
        {isHeader && onToggle && (
          <button
            onClick={onToggle}
            className="flex items-center text-gray-500 hover:text-indigo-600 pt-2 transition-colors"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Drag handle */}
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          className="flex items-center text-gray-400 pt-2 cursor-move"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>

        {/* Content */}
        <div
          className="flex-1 cursor-default"
          draggable={false}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`text-xs font-semibold ${config.labelColor} uppercase tracking-wide`}
            >
              {config.label}
            </span>
            {element.type === "header" && itemCount !== undefined && (
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          {config.inputType === "input" ? (
            <input
              type="text"
              value={element.content}
              onChange={(e) => onContentChange(element.id, e.target.value)}
              placeholder={config.placeholder}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${config.focusRing} outline-none`}
            />
          ) : (
            <textarea
              value={element.content}
              onChange={(e) => onContentChange(element.id, e.target.value)}
              rows="3"
              placeholder={config.placeholder}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${config.focusRing} outline-none resize-none`}
            />
          )}
        </div>
        <RemoveButton
          handleRemove={onRemove}
          params={[element.id]}
          icon="cross"
        />
      </div>
    </div>
  );
}

export default DraggableBlock;
