import React from "react";
import RemoveButton from "./RemoveButton";

const BLOCK_CONFIGS = {
  header: {
    label: "Apartat",
    borderColor: "border-indigo-200",
    labelColor: "text-indigo-600",
    focusRing: "focus:ring-indigo-500 focus:border-indigo-500",
    inputType: "input",
    placeholder: "Escriu el títol de la secció...",
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
}) {
  const config = BLOCK_CONFIGS[element.type] || BLOCK_CONFIGS.item;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, element)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, element)}
      className={`bg-white border-2 ${config.borderColor} rounded-lg p-3 cursor-move hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div className="flex items-center text-gray-400 pt-2">
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
        <div className="flex-1">
          <div className="mb-1">
            <span
              className={`text-xs font-semibold ${config.labelColor} uppercase tracking-wide`}
            >
              {config.label}
            </span>
          </div>

          {config.inputType === "input" ? (
            <input
              type="text"
              value={element.content}
              onChange={(e) => onContentChange(element.id, e.target.value)}
              placeholder={config.placeholder}
              onClick={(e) => e.stopPropagation()}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${config.focusRing} outline-none`}
            />
          ) : (
            <textarea
              value={element.content}
              onChange={(e) => onContentChange(element.id, e.target.value)}
              rows="3"
              placeholder={config.placeholder}
              onClick={(e) => e.stopPropagation()}
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
