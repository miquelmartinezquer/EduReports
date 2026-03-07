import { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  deleteCategory,
  addItemToCategory,
  removeItemFromCategory,
  getAvailableColors,
} from "../services/categoriesService";
import RemoveButton from "./RemoveButton";
import { COLOR_CLASSES, DEFAULT_COLOR } from "../services/colorHelper";

// Mapeo estático de colores para que Tailwind las detecte durante el build

function CategoryManager({ onClose, onCategoriesUpdated, courseId = null }) {
  const [categories, setCategories] = useState({});
  const [availableColors, setAvailableColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estat per nova categoria
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryKey, setNewCategoryKey] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("purple");

  // Estat per afegir item
  const [addingItemTo, setAddingItemTo] = useState(null);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, colorsData] = await Promise.all([
        getCategories(courseId),
        getAvailableColors(courseId),
      ]);
      setCategories(categoriesData);
      setAvailableColors(colorsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories(courseId);
      setCategories(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Introdueix la clau i el nom de la categoria");
      return;
    }
    const key = newCategoryName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar diacrítics/accents
      .replace(/\s+/g, "_");

    try {
      await createCategory(
        key,
        newCategoryName,
        newCategoryColor,
        [],
        courseId,
      );
      await loadCategories();
      setShowNewCategory(false);
      setNewCategoryKey("");
      setNewCategoryName("");
      setNewCategoryColor("purple");
      onCategoriesUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (key) => {
    if (!window.confirm("Segur que vols eliminar aquesta categoria?")) return;

    try {
      await deleteCategory(key, courseId);
      await loadCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddItem = async (categoryKey) => {
    if (!newItemText.trim()) {
      alert("Introdueix el text de l'item");
      return;
    }

    try {
      await addItemToCategory(categoryKey, newItemText, courseId);
      await loadCategories();
      setAddingItemTo(null);
      setNewItemText("");
      onCategoriesUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveItem = async (categoryKey, itemIndex) => {
    if (!window.confirm("Segur que vols eliminar aquest item?")) return;

    try {
      await removeItemFromCategory(categoryKey, itemIndex, courseId);
      await loadCategories();
      onCategoriesUpdated?.();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Gestionar Categories
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Crea, edita i elimina categories i items d'avaluació
            </p>
          </div>
          <button
            onClick={onClose}
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
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregant...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Botó per afegir nova categoria */}
              {!showNewCategory && (
                <button
                  onClick={() => setShowNewCategory(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Afegir Nova Categoria
                </button>
              )}

              {/* Formulari nova categoria */}
              {showNewCategory && (
                <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50 space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Nova Categoria
                  </h4>
                  <div className="grid">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Ex: Motricitat i Moviment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color.key}
                          onClick={() => setNewCategoryColor(color.key)}
                          className={`w-10 h-10 rounded-lg ${COLOR_CLASSES[color.key]["bg"] || "bg-gray-400"} ${newCategoryColor === color.key ? "ring-2 ring-offset-2 ring-indigo-500" : ""}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCategory}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Crear Categoria
                    </button>
                    <button
                      onClick={() => setShowNewCategory(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel·lar
                    </button>
                  </div>
                </div>
              )}

              {/* Llista de categories */}
              {Object.entries(categories).map(([key, category]) => {
                const colorClass =
                  COLOR_CLASSES[category.color]["bg"] || "bg-gray-400";

                return (
                  <div
                    key={key}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 ${colorClass} rounded-lg`}
                        ></div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {category.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Items: {category.items.length}
                          </p>
                        </div>
                      </div>
                      <RemoveButton
                        handleRemove={handleDeleteCategory}
                        params={[key]}
                        icon="trash"
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      {category.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{item}</span>
                          <RemoveButton
                            handleRemove={handleRemoveItem}
                            params={[key, index]}
                            icon="cross"
                          />
                        </div>
                      ))}

                      {/* Afegir nou item */}
                      {addingItemTo === key ? (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder="Text del nou item..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleAddItem(key)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                          >
                            Afegir
                          </button>
                          <button
                            onClick={() => {
                              setAddingItemTo(null);
                              setNewItemText("");
                            }}
                            className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                          >
                            Cancel·lar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingItemTo(key)}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-300"
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Afegir item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryManager;
