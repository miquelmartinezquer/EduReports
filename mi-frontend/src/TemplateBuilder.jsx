import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DraggableBlock from "./components/DraggableBlock";
import CategorySelector from "./components/CategorySelector";
import AddItemButton from "./components/AddItemButton";
import AddFreeTextButton from "./components/AddFreeTextButton";
import AddSectionButton from "./components/AddSectionButton";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

function TemplateBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseId = searchParams.get("courseId");
  const courseName = searchParams.get("courseName") || "Curs";
  const routeId = searchParams.get("routeId");

  const [elements, setElements] = useState([]);
  const [elementCounter, setElementCounter] = useState(0);
  const [draggedElement, setDraggedElement] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);
  const [categoriesData, setCategoriesData] = useState({});
  const [availableColors, setAvailableColors] = useState([]);
  const [routeName, setRouteName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showClearTemplateModal, setShowClearTemplateModal] = useState(false);
  const [optionDraftByItemId, setOptionDraftByItemId] = useState({});
  const [includeConclusions, setIncludeConclusions] = useState(false);
  const [conclusionsTitle, setConclusionsTitle] = useState(
    "Observacions finals",
  );
  const [conclusionsGuidance, setConclusionsGuidance] = useState("");
  const [expandedHeaderId, setExpandedHeaderId] = useState(null);

  const selectedItemsUsage = useMemo(() => {
    const usageMap = {};

    elements.forEach((element) => {
      if (element.type !== "header" || !Array.isArray(element.items)) {
        return;
      }

      element.items.forEach((item) => {
        const normalizedText = String(item?.content || "")
          .trim()
          .toLowerCase();

        if (!normalizedText) return;

        usageMap[normalizedText] = (usageMap[normalizedText] || 0) + 1;
      });
    });

    return usageMap;
  }, [elements]);

  const loadCategories = async () => {
    if (!courseId) return;

    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories`);
      setCategoriesData(data || {});
    } catch (error) {
      console.error("Error carregant categories:", error);
    }
  };

  const loadColors = async () => {
    if (!courseId) return;

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/colors`,
      );
      setAvailableColors(data || []);
    } catch (error) {
      console.error("Error carregant colors:", error);
    }
  };

  const loadEvaluationRoute = async () => {
    if (!courseId || !routeId) return;

    try {
      const evaluationRoute = await fetchWithAuth(
        `/courses/${courseId}/evaluation-routes/${routeId}`,
      );

      const sections = Array.isArray(evaluationRoute.sections)
        ? evaluationRoute.sections
        : [];
      const rebuiltElements = [];
      let counter = 0;

      sections.forEach((section) => {
        counter += 1;
        const headerId = `element-${counter}`;
        const items = Array.isArray(section.items) ? section.items : [];

        const mappedItems = items.map((item) => {
          counter += 1;
          return {
            id: `item-${counter}`,
            type: "item",
            content: item.content || "",
            category: item.category || "Escriptura lliure",
            responseOptions: Array.isArray(item.responseOptions)
              ? item.responseOptions
              : [],
          };
        });

        rebuiltElements.push({
          id: headerId,
          type: "header",
          content: section.title || "",
          order: rebuiltElements.length + 1,
          items: mappedItems,
        });
      });

      setRouteName(evaluationRoute.name || "");
      setElements(rebuiltElements);
      setElementCounter(counter);
      setIncludeConclusions(Boolean(evaluationRoute?.conclusions?.enabled));
      setConclusionsTitle(
        evaluationRoute?.conclusions?.title?.trim() || "Observacions finals",
      );
      setConclusionsGuidance(evaluationRoute?.conclusions?.guidance || "");
    } catch (error) {
      console.error("Error carregant ruta d'avaluacio:", error);
      alert(error.message || "No s'ha pogut carregar la ruta d'avaluacio");
    }
  };

  useEffect(() => {
    loadCategories();
    loadColors();
    loadEvaluationRoute();
  }, [courseId, routeId]);

  useEffect(() => {
    if (showItemModal) {
      document.body.style.overflow = "hidden";
      return;
    }
    document.body.style.overflow = "unset";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showItemModal]);

  const addHeader = () => {
    const newCounter = elementCounter + 1;
    const newElement = {
      id: `element-${newCounter}`,
      type: "header",
      content: "",
      order: newCounter,
      items: [],
    };

    setElements([...elements, newElement]);
    setElementCounter(newCounter);
    // Expandir automàticament el nou apartat
    setExpandedHeaderId(`element-${newCounter}`);
  };

  const toggleHeader = (headerId) => {
    setExpandedHeaderId((prev) => (prev === headerId ? null : headerId));
  };

  const addItem = (headerId = null) => {
    if (headerId) {
      setSelectedHeaderId(headerId);
      setShowItemModal(true);
      return;
    }

    if (elements.length === 0) {
      alert("Primer has d'afegir un apartat.");
      return;
    }

    const lastHeaderIndex = [...elements]
      .reverse()
      .findIndex((el) => el.type === "header");

    if (lastHeaderIndex === -1) {
      alert("Primer has d'afegir un apartat.");
      return;
    }

    const actualIndex = elements.length - 1 - lastHeaderIndex;
    setSelectedHeaderId(elements[actualIndex].id);
    setShowItemModal(true);
  };

  const addFreeTextBlock = (headerId = null) => {
    let targetHeaderId = headerId;

    if (!targetHeaderId) {
      if (elements.length === 0) {
        alert("Primer has d'afegir un apartat.");
        return;
      }

      const lastHeaderIndex = [...elements]
        .reverse()
        .findIndex((el) => el.type === "header");

      if (lastHeaderIndex === -1) {
        alert("Primer has d'afegir un apartat.");
        return;
      }

      const actualIndex = elements.length - 1 - lastHeaderIndex;
      targetHeaderId = elements[actualIndex].id;
    }

    const headerIndex = elements.findIndex((el) => el.id === targetHeaderId);
    if (headerIndex === -1) return;

    const newCounter = elementCounter + 1;
    const newItem = {
      id: `item-${newCounter}`,
      type: "item",
      content: "",
      category: "Escriptura lliure",
      responseOptions: [],
    };

    const updatedElements = [...elements];
    updatedElements[headerIndex].items.push(newItem);

    setElements(updatedElements);
    setElementCounter(newCounter);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedHeaderId(null);
  };

  const handleSelectItem = (itemText, categoryName) => {
    if (!selectedHeaderId) {
      alert("No s'ha seleccionat cap apartat.");
      closeItemModal();
      return;
    }

    const headerIndex = elements.findIndex((el) => el.id === selectedHeaderId);
    if (headerIndex === -1) {
      alert("No s'ha trobat l'apartat seleccionat.");
      closeItemModal();
      return;
    }

    // Comprovar si l'item ja està utilitzat
    const normalizedText = String(itemText || "")
      .trim()
      .toLowerCase();
    const usageCount = selectedItemsUsage[normalizedText] || 0;

    if (usageCount >= 1) {
      return; // No afegir si ja està utilitzat
    }

    const newCounter = elementCounter + 1;
    const newItem = {
      id: `item-${newCounter}`,
      type: "item",
      content: itemText,
      category: categoryName,
      responseOptions: [],
    };

    const updatedElements = [...elements];
    updatedElements[headerIndex].items.push(newItem);

    setElements(updatedElements);
    setElementCounter(newCounter);
  };

  const handleRemoveItemByContent = (itemText) => {
    const normalizedText = String(itemText || "")
      .trim()
      .toLowerCase();

    const updatedElements = elements.map((element) => {
      if (element.type !== "header" || !Array.isArray(element.items)) {
        return element;
      }

      return {
        ...element,
        items: element.items.filter((item) => {
          const itemNormalized = String(item?.content || "")
            .trim()
            .toLowerCase();
          return itemNormalized !== normalizedText;
        }),
      };
    });

    setElements(updatedElements);
  };

  const removeElement = (headerId, itemId = null) => {
    if (itemId === null) {
      const removedHeader = elements.find((el) => el.id === headerId);
      if (removedHeader?.items?.length) {
        setOptionDraftByItemId((prev) => {
          const next = { ...prev };
          removedHeader.items.forEach((item) => {
            delete next[item.id];
          });
          return next;
        });
      }
      setElements(elements.filter((el) => el.id !== headerId));
      return;
    }

    setOptionDraftByItemId((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    const updatedElements = elements.map((el) => {
      if (el.id === headerId) {
        return {
          ...el,
          items: el.items.filter((item) => item.id !== itemId),
        };
      }
      return el;
    });

    setElements(updatedElements);
  };

  const clearAll = () => {
    setElements([]);
    setElementCounter(0);
    setShowClearTemplateModal(false);
  };

  const updateElementContent = (headerId, content, itemId = null) => {
    if (itemId === null) {
      setElements(
        elements.map((el) => (el.id === headerId ? { ...el, content } : el)),
      );
      return;
    }

    const updatedElements = elements.map((el) => {
      if (el.id === headerId) {
        return {
          ...el,
          items: el.items.map((item) =>
            item.id === itemId ? { ...item, content } : item,
          ),
        };
      }
      return el;
    });

    setElements(updatedElements);
  };

  const updateItemResponseOptions = (headerId, itemId, updater) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== headerId) return el;

        return {
          ...el,
          items: (el.items || []).map((item) => {
            if (item.id !== itemId) return item;
            const currentOptions = Array.isArray(item.responseOptions)
              ? item.responseOptions
              : [];
            const nextOptions = updater(currentOptions)
              .map((option) => String(option || "").trim())
              .filter(Boolean);
            return {
              ...item,
              responseOptions: [...new Set(nextOptions)],
            };
          }),
        };
      }),
    );
  };

  const addResponseOption = (headerId, itemId) => {
    const draftValue = String(optionDraftByItemId[itemId] || "").trim();
    if (!draftValue) return;

    updateItemResponseOptions(headerId, itemId, (options) => [
      ...options,
      draftValue,
    ]);

    setOptionDraftByItemId((prev) => ({ ...prev, [itemId]: "" }));
  };

  const removeResponseOption = (headerId, itemId, optionToRemove) => {
    updateItemResponseOptions(
      headerId,
      itemId,
      (options) => options.filter((opt) => opt !== optionToRemove),
    );
  };

  const handleDragStart = (e, element) => {
    setDraggedElement(element);
    e.currentTarget.style.opacity = "0.4";
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetElement) => {
    e.preventDefault();

    if (!draggedElement || draggedElement.id === targetElement.id) return;

    if (draggedElement.type === "header" && targetElement.type === "header") {
      const draggedIndex = elements.findIndex(
        (el) => el.id === draggedElement.id,
      );
      const targetIndex = elements.findIndex(
        (el) => el.id === targetElement.id,
      );

      const newElements = [...elements];
      newElements.splice(draggedIndex, 1);
      newElements.splice(targetIndex, 0, draggedElement);

      setElements(newElements);
    } else if (
      draggedElement.type === "item" &&
      targetElement.type === "item"
    ) {
      let sourceHeaderIndex = -1;
      let targetHeaderIndex = -1;

      elements.forEach((el, idx) => {
        if (
          el.items &&
          el.items.find((item) => item.id === draggedElement.id)
        ) {
          sourceHeaderIndex = idx;
        }
        if (el.items && el.items.find((item) => item.id === targetElement.id)) {
          targetHeaderIndex = idx;
        }
      });

      if (sourceHeaderIndex === -1 || targetHeaderIndex === -1) return;

      const newElements = [...elements];

      if (sourceHeaderIndex === targetHeaderIndex) {
        const items = [...newElements[sourceHeaderIndex].items];
        const draggedIndex = items.findIndex(
          (item) => item.id === draggedElement.id,
        );
        const targetIndex = items.findIndex(
          (item) => item.id === targetElement.id,
        );

        items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, draggedElement);

        newElements[sourceHeaderIndex].items = items;
      } else {
        newElements[sourceHeaderIndex].items = newElements[
          sourceHeaderIndex
        ].items.filter((item) => item.id !== draggedElement.id);

        const targetItemIndex = newElements[targetHeaderIndex].items.findIndex(
          (item) => item.id === targetElement.id,
        );
        newElements[targetHeaderIndex].items.splice(
          targetItemIndex,
          0,
          draggedElement,
        );
      }

      setElements(newElements);
    }

    setDraggedElement(null);
  };

  const buildEvaluationRouteData = () => {
    const sections = elements
      .filter((el) => el.type === "header" && el.content.trim())
      .map((el) => ({
        title: el.content.trim(),
        items: (el.items || [])
          .filter((item) => item.content.trim())
          .map((item) => ({
            content: item.content.trim(),
            category: item.category || "Escriptura lliure",
            responseOptions: Array.isArray(item.responseOptions)
              ? item.responseOptions
                  .map((option) => String(option || "").trim())
                  .filter(Boolean)
              : [],
          })),
      }));

    return {
      name: routeName.trim(),
      courseId: courseId ? parseInt(courseId, 10) : null,
      courseName,
      sections,
      conclusions: {
        enabled: includeConclusions,
        title:
          includeConclusions && conclusionsTitle.trim()
            ? conclusionsTitle.trim()
            : "Observacions finals",
        guidance:
          includeConclusions && conclusionsGuidance.trim()
            ? conclusionsGuidance.trim()
            : null,
      },
      updatedAt: new Date().toISOString(),
    };
  };

  const saveEvaluationRoute = async () => {
    if (!courseId) {
      toast.error("No s'ha pogut identificar el curs de la ruta.");
      return;
    }

    if (!routeName.trim()) {
      toast.error("Posa un nom a la ruta d'avaluacio.");
      return;
    }

    if (elements.length === 0) {
      toast.error(
        "Afegeix almenys un apartat abans de guardar la ruta d'avaluacio.",
      );
      return;
    }

    // Validar que tots els apartats tinguin nom
    const sectionsWithoutName = elements.filter(
      (el) => el.type === "header" && !el.content?.trim(),
    );

    if (sectionsWithoutName.length > 0) {
      toast.error(
        `Hi ha ${sectionsWithoutName.length} ${sectionsWithoutName.length === 1 ? "apartat sense nom" : "apartats sense nom"}. Afegeix un títol a tots els apartats.`,
      );
      return;
    }

    const evaluationRoute = buildEvaluationRouteData();

    try {
      setIsSaving(true);
      const url = routeId
        ? `/courses/${courseId}/evaluation-routes/${routeId}`
        : `/courses/${courseId}/evaluation-routes`;
      const method = routeId ? "PUT" : "POST";

      await fetchWithAuth(url, {
        method,
        body: JSON.stringify({
          name: evaluationRoute.name,
          sections: evaluationRoute.sections,
          conclusions: evaluationRoute.conclusions,
        }),
      });

      setSaveMessage("Ruta d'avaluacio guardada correctament");
      setTimeout(() => setSaveMessage(""), 2500);
      toast.success("Ruta d'avaluacio guardada correctament");
    } catch (error) {
      console.error("Error guardant ruta d'avaluacio:", error);
      toast.error(
        error.message || "No s'ha pogut guardar la ruta d'avaluacio",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveRouteSilentlyBeforeBack = async () => {
    if (!courseId || !routeName.trim() || elements.length === 0) {
      return;
    }

    const evaluationRoute = buildEvaluationRouteData();

    try {
      const url = routeId
        ? `/courses/${courseId}/evaluation-routes/${routeId}`
        : `/courses/${courseId}/evaluation-routes`;
      const method = routeId ? "PUT" : "POST";

      await fetchWithAuth(url, {
        method,
        body: JSON.stringify({
          name: evaluationRoute.name,
          sections: evaluationRoute.sections,
          conclusions: evaluationRoute.conclusions,
        }),
      });
    } catch (error) {
      console.error(
        "Error auto-guardant ruta d'avaluacio abans de sortir:",
        error,
      );
    }
  };

  const goBack = async () => {
    await saveRouteSilentlyBeforeBack();

    if (courseId) {
      navigate(`/cursos/${courseId}`);
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto pb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={goBack}
              variant="ghost"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Tornar al curs
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Creador de Rutes d'Avaluacio
            </h1>
            <p className="text-gray-600">
              Defineix preguntes d'avaluacio i opcions de comentari reutilitzables
              per fer informes guiats
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
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
                      d="M7 7h10M7 12h10m-7 5h7"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Ruta d'avaluacio</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la ruta
                  </label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="Ex: Seguiment 2n trimestre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Curs
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-600"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200 space-y-3">
                  <label className="flex items-start gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={includeConclusions}
                      onChange={(e) => setIncludeConclusions(e.target.checked)}
                      className="mt-0.5"
                    />
                    Observacions finals
                  </label>

                  {includeConclusions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Títol de l'apartat
                      </label>
                      <input
                        type="text"
                        value={conclusionsTitle}
                        onChange={(e) => setConclusionsTitle(e.target.value)}
                        placeholder="Ex: Observacions finals"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
                      />

                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pautes per a la IA (opcional)
                      </label>
                      <textarea
                        value={conclusionsGuidance}
                        onChange={(e) => setConclusionsGuidance(e.target.value)}
                        placeholder="Ex: destacar evolució en autonomia i convivència"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-24"
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  Cada item pot tenir diverses opcions de comentari per triar durant l'avaluacio guiada.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Estructura de la Ruta d'Avaluacio
                </h3>
                <p className="text-gray-500 text-sm">
                  Organitza blocs arrossegant-los. Afegeix apartats i items per
                  construir la ruta.
                </p>
              </div>

              <div className="space-y-4 min-h-75">
                {elements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-indigo-600"
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
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Comença la teva ruta d'avaluacio
                    </h4>
                    <p className="text-gray-500 text-sm text-center max-w-xs mb-6">
                      Primer crea un apartat i després afegeix-hi items
                    </p>
                    <Button
                      onClick={addHeader}
                      variant="brand"
                      size="lg"
                      className="flex items-center gap-2"
                    >
                      Afegir primer apartat
                    </Button>
                  </div>
                ) : (
                  elements.map((element, idx) => (
                    <div key={element.id} className="space-y-3">
                      <DraggableBlock
                        element={element}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onContentChange={(id, content) =>
                          updateElementContent(id, content)
                        }
                        onRemove={(id) => removeElement(id)}
                        itemCount={element.items?.length || 0}
                        isExpanded={expandedHeaderId === element.id}
                        onToggle={() => toggleHeader(element.id)}
                        sectionNumber={idx + 1}
                      />

                      {/* Items dentro del header - només mostrar si està expandit */}
                      {expandedHeaderId === element.id && (
                        <div className="ml-8 border-l-2 border-indigo-200 pl-4">
                          {element.items && element.items.length > 0 && (
                            <div className="space-y-3 mb-3">
                              {element.items.map((item) => (
                                <div key={item.id} className="space-y-2">
                                  <DraggableBlock
                                    element={item}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onContentChange={(id, content) =>
                                      updateElementContent(
                                        element.id,
                                        content,
                                        id,
                                      )
                                    }
                                    onRemove={(id) =>
                                      removeElement(element.id, id)
                                    }
                                  />

                                  <div className="ml-10 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                      Opcions de comentari per aquest item
                                    </p>

                                    {Array.isArray(item.responseOptions) &&
                                    item.responseOptions.length > 0 ? (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {item.responseOptions.map((option) => (
                                          <span
                                            key={`${item.id}-${option}`}
                                            className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full"
                                          >
                                            {option}
                                            <button
                                              type="button"
                                              className="text-indigo-700 hover:text-indigo-900"
                                              onClick={() =>
                                                removeResponseOption(
                                                  element.id,
                                                  item.id,
                                                  option,
                                                )
                                              }
                                            >
                                              x
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 mb-3">
                                        Sense opcions. El professor podra escriure text lliure o no avaluar.
                                      </p>
                                    )}

                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={optionDraftByItemId[item.id] || ""}
                                        onChange={(e) =>
                                          setOptionDraftByItemId((prev) => ({
                                            ...prev,
                                            [item.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            addResponseOption(element.id, item.id);
                                          }
                                        }}
                                        placeholder="Ex: Mostra autonomia en les rutines"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                          addResponseOption(element.id, item.id)
                                        }
                                      >
                                        Afegir opcio
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <AddItemButton
                              onClick={() => addItem(element.id)}
                            />
                            <AddFreeTextButton
                              onClick={() => addFreeTextBlock(element.id)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {elements.length > 0 && (
                  <AddSectionButton onClick={addHeader} />
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end items-center gap-3">
                {saveMessage && (
                  <span className="text-sm text-emerald-600 font-medium">
                    {saveMessage}
                  </span>
                )}

                <Button
                  type="button"
                  onClick={() => setShowClearTemplateModal(true)}
                  variant="outline"
                >
                  Netejar
                </Button>
                <Button
                  type="button"
                  onClick={saveEvaluationRoute}
                  variant="brand"
                  disabled={isSaving}
                >
                  Guardar ruta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={showClearTemplateModal}
        onOpenChange={setShowClearTemplateModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Netejar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              S'esborraran tots els apartats i items de la ruta actual.
              Aquesta accio no es pot desfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={clearAll}>
              Si, netejar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Selecciona un item
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Escull un item de les categories del curs
                </p>
              </div>
              <Button
                onClick={closeItemModal}
                variant="ghost"
                size="icon-sm"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
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

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <CategorySelector
                categoriesData={categoriesData}
                availableColors={availableColors}
                itemUsageMap={selectedItemsUsage}
                onSelectItem={handleSelectItem}
                onRemoveItem={handleRemoveItemByContent}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateBuilder;
