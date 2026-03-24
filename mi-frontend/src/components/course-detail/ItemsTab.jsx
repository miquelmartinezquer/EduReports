import { useState } from "react";
import { Button } from "@/components/ui/button";
import ExpandableActionButton from "../ExpandableActionButton";

function ItemsTab({
  categories,
  onOpenCreateCategoryModal,
  onOpenImportItems,
  onOpenExportItems,
  onOpenEditCategoryModal,
  onRequestDeleteCategory,
  onOpenEditItemModal,
  onRequestRemoveItem,
  onOpenCreateItemModal,
}) {
  const [openKey, setOpenKey] = useState(null);

  const toggleCategory = (key) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="pb-8">
      <div className="mb-6 flex items-center gap-3">
        <ExpandableActionButton
          onClick={onOpenCreateCategoryModal}
          label="Afegir Categoria"
          variant="brand"
          size="lg"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        />
        <ExpandableActionButton
          type="button"
          onClick={onOpenImportItems}
          label="Carregar Items"
          variant="outline"
          size="lg"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 16V6m0 0l-4 4m4-4l4 4M4 18h16"
              />
            </svg>
          }
        />
        <ExpandableActionButton
          type="button"
          onClick={onOpenExportItems}
          label="Descarregar Items"
          variant="outline"
          size="lg"
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v10m0 0l-4-4m4 4l4-4M4 6h16"
              />
            </svg>
          }
        />
      </div>

      {Object.keys(categories).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hi ha categories encara
          </h3>
          <p className="text-gray-500 text-sm">
            Crea la primera categoria per organitzar els teus items
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categories).map(([key, category]) => {
            const colorClasses = {
              purple: "bg-purple-500",
              blue: "bg-blue-500",
              green: "bg-green-500",
              orange: "bg-orange-500",
              red: "bg-red-500",
              pink: "bg-pink-500",
              yellow: "bg-yellow-500",
              teal: "bg-teal-500",
              cyan: "bg-cyan-500",
              indigo: "bg-indigo-500",
              slate: "bg-slate-500",
              emerald: "bg-emerald-500",
            };
            const colorClass = colorClasses[category.color] || "bg-gray-400";

            return (
              <div
                key={key}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(key)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${colorClass} rounded-lg`}></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {category.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Items: {category.items.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditCategoryModal(key, category);
                      }}
                      variant="ghost"
                      size="icon-sm"
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Editar categoria"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDeleteCategory(key, category.name);
                      }}
                      variant="ghost"
                      size="icon-sm"
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openKey === key ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {openKey === key && (
                  <div className="p-4 space-y-2">
                    {category.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{item}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() =>
                              onOpenEditItemModal(key, index, item)
                            }
                            variant="ghost"
                            size="icon-xs"
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Editar item"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button
                            onClick={() =>
                              onRequestRemoveItem(key, index, item)
                            }
                            variant="ghost"
                            size="icon-xs"
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={() => onOpenCreateItemModal(key)}
                      variant="outline"
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-300"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Afegir item
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ItemsTab;
