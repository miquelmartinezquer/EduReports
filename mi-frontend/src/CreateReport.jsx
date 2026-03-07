import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DraggableBlock from "./components/DraggableBlock";
import CategorySelector from "./components/CategorySelector";
import CategoryManager from "./components/CategoryManager";
import AddItemButton from "./components/AddItemButton";
import AddFreeTextButton from "./components/AddFreeTextButton";
import AddSectionButton from "./components/AddSectionButton";
import FinalizeModal from "./components/FinalizeModal";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";

function CreateReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [elements, setElements] = useState([]);
  const [elementCounter, setElementCounter] = useState(0);
  const [draggedElement, setDraggedElement] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [jsonOutput, setJsonOutput] = useState("");
  const [categoriesData, setCategoriesData] = useState({});
  const [availableColors, setAvailableColors] = useState([]);
  const [saveMessage, setSaveMessage] = useState("");

  // Dades de l'alumne
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");
  const [studentName, setStudentName] = useState(
    searchParams.get("studentName") || "",
  );
  const [course, setCourse] = useState(searchParams.get("courseName") || "I3");
  const [language, setLanguage] = useState("Català");

  // Carregar categories i colors del backend
  const loadCategories = async () => {
    if (!courseId) {
      console.warn("No courseId disponible per carregar categories");
      return;
    }
    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories`);
      setCategoriesData(data);
    } catch (error) {
      console.error("Error carregant categories:", error);
    }
  };

  const loadColors = async () => {
    try {
      const data = await fetchWithAuth("/userCategories/colors");
      setAvailableColors(data);
    } catch (error) {
      console.error("Error carregant colors:", error);
    }
  };

  const loadState = async () => {
    if (!studentId) return; // No carregar si no hi ha studentId

    console.log("Intentant carregar esborrany per studentId:", studentId);

    try {
      const draft = await fetchWithAuth(`/drafts/${studentId}`);

      console.log("Esborrany carregat:", draft);

      if (draft) {
        // Migrar datos antiguos a la nueva estructura si es necesario
        const migratedElements = draft.elements.map((el) => {
          if (el.type === "header" && !el.items) {
            return { ...el, items: [] };
          }
          return el;
        });

        // Filtrar items que ya no estarán en la raíz
        const onlyHeaders = migratedElements.filter(
          (el) => el.type === "header",
        );

        setElements(onlyHeaders);
        setStudentName(draft.studentName);
        setCourse(draft.course);
        setLanguage(draft.language);
        setElementCounter(draft.elementCounter);
      }
    } catch (error) {
      // Si no hi ha esborrany (404) o error, no passa res
      console.log(
        "No s'ha trobat cap esborrany per aquest alumne:",
        error.message,
      );
    }
  };

  const saveProgressToBackend = async (isSilent = false) => {
    if (!studentId) {
      if (!isSilent) {
        alert("No es pot guardar: falta l'identificador de l'alumne");
      }
      console.warn("No es pot guardar: falta studentId");
      return;
    }

    const draftData = {
      courseId,
      elements,
      studentName,
      course,
      language,
      elementCounter,
    };

    console.log("Guardant esborrany per studentId:", studentId, draftData);

    try {
      const response = await fetchWithAuth(`/drafts/${studentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draftData),
      });

      console.log("Esborrany guardat correctament:", response);

      // Mostrar missatge de confirmació només si no és auto-save
      if (!isSilent) {
        setSaveMessage("Progrés guardat correctament");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error guardant el progrés:", error);
      if (!isSilent) {
        alert("Error guardant el progrés");
      }
    }
  };

  const saveProgress = () => {
    saveProgressToBackend(false);
  };

  // Inicialitzar dades del curs
  useEffect(() => {
    const initializeData = async () => {
      await loadCategories();
      await loadColors();
      await loadState();
    };

    initializeData();
  }, [courseId]);

  // Auto-save amb useEffect - guardar al backend
  useEffect(() => {
    if (!studentId) return; // No guardar si no hi ha studentId

    // Debounce: espera 2s després de l'últim canvi per guardar
    const timeoutId = setTimeout(() => {
      console.log("Auto-guardant esborrany al backend...");
      saveProgressToBackend(true); // true = auto-save silenciós
    }, 2000);

    return () => clearTimeout(timeoutId); // Cleanup
  }, [elements, studentName, course, language, elementCounter, studentId]);

  // Bloquejar scroll quan els modals estan oberts
  useEffect(() => {
    if (showItemModal || showCategoryManager || showFinalizeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup quan el component es desmunta
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showItemModal, showCategoryManager, showFinalizeModal]);

  const addHeader = () => {
    const newCounter = elementCounter + 1;
    const newElement = {
      id: `element-${newCounter}`,
      type: "header",
      content: "",
      order: newCounter,
      items: [], // Array para contener los items de esta sección
    };
    setElements([...elements, newElement]);
    setElementCounter(newCounter);
  };

  const addItem = (headerId = null) => {
    if (headerId) {
      setSelectedHeaderId(headerId);
      setShowItemModal(true);
    } else {
      // Afegir al darrer header si no s'especifica
      if (elements.length === 0) {
        alert("Primer has d'afegir un títol per organitzar els continguts.");
        return;
      }
      const lastHeaderIndex = [...elements]
        .reverse()
        .findIndex((el) => el.type === "header");
      if (lastHeaderIndex === -1) {
        alert("Primer has d'afegir un títol per organitzar els continguts.");
        return;
      }
      const actualIndex = elements.length - 1 - lastHeaderIndex;
      setSelectedHeaderId(elements[actualIndex].id);
      setShowItemModal(true);
    }
  };

  const addFreeTextBlock = (headerId = null) => {
    let targetHeaderId = headerId;

    if (!targetHeaderId) {
      // Si no s'especifica, afegir al darrer header
      if (elements.length === 0) {
        alert("Primer has d'afegir un títol per organitzar els continguts.");
        return;
      }
      const lastHeaderIndex = [...elements]
        .reverse()
        .findIndex((el) => el.type === "header");
      if (lastHeaderIndex === -1) {
        alert("Primer has d'afegir un títol per organitzar els continguts.");
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

    const newCounter = elementCounter + 1;
    const newItem = {
      id: `item-${newCounter}`,
      type: "item",
      content: itemText,
      category: categoryName,
    };

    const updatedElements = [...elements];
    updatedElements[headerIndex].items.push(newItem);
    setElements(updatedElements);
    setElementCounter(newCounter);
    closeItemModal();
  };

  const removeElement = (headerId, itemId = null) => {
    if (itemId === null) {
      // Eliminar un header completo
      setElements(elements.filter((el) => el.id !== headerId));
    } else {
      // Eliminar un item de dentro de un header
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
    }
  };

  const clearAll = () => {
    if (window.confirm("Estàs segur que vols esborrar tots els elements?")) {
      setElements([]);
      setElementCounter(0);
    }
  };

  const updateElementContent = (headerId, content, itemId = null) => {
    if (itemId === null) {
      // Actualizar el contenido de un header
      setElements(
        elements.map((el) => (el.id === headerId ? { ...el, content } : el)),
      );
    } else {
      // Actualizar el contenido de un item dentro de un header
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
    }
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

    // Ambos son headers - reordenar headers
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
    }
    // Ambos son items - pueden estar en el mismo o diferente header
    else if (draggedElement.type === "item" && targetElement.type === "item") {
      // Encontrar los headers que contienen cada item
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

      // Si están en el mismo header, reordenar
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
        // Si están en diferentes headers, mover de uno a otro
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

  const buildReportData = () => {
    const sections = [];

    elements.forEach((element) => {
      if (element.type === "header" && element.content.trim()) {
        const section = {
          type: "section",
          title: element.content.trim(),
          items: element.items
            .filter((item) => item.content.trim())
            .map((item) => ({
              content: item.content.trim(),
            })),
        };
        sections.push(section);
      }
    });

    return {
      student: {
        name: studentName.trim(),
        date: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        course: course,
        language: language,
      },
      sections: sections,
    };
  };

  const generateReport = () => {
    if (elements.length === 0) {
      alert(
        "No hi ha cap element per generar. Afegeix encapçalaments i items primer.",
      );
      return;
    }

    const reportData = buildReportData();
    setJsonOutput(JSON.stringify(reportData, null, 2));
    setShowJsonModal(true);
  };

  const openFinalizeModal = () => {
    if (elements.length === 0) {
      alert(
        "No hi ha cap element per generar. Afegeix encapçalaments i items primer.",
      );
      return;
    }

    if (!studentName.trim()) {
      alert("Introdueix el nom de l'alumne.");
      return;
    }

    setShowFinalizeModal(true);
  };

  const navigateToGenerating = () => {
    const reportData = buildReportData();
    navigate("/generating-report", {
      state: {
        reportData,
        studentId,
        courseId,
      },
    });
  };

  const closeFinalizeModal = () => {
    setShowFinalizeModal(false);
  };

  const closeJsonModal = () => {
    setShowJsonModal(false);
  };

  const copyJson = () => {
    navigator.clipboard
      .writeText(jsonOutput)
      .then(() => {
        alert("JSON copiat al portapapers!");
      })
      .catch((err) => {
        console.error("Error copiant el JSON:", err);
        alert("Error copiant el JSON");
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <NavBar />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(courseId ? `/cursos/${courseId}` : "/")}
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
              Tornar als Cursos
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Creador d'Informes
            </h1>
            <p className="text-gray-600">
              Dissenya i organitza l'estructura del teu informe d'avaluació de
              forma visual i intuïtiva
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {/* Dades de l'alumne */}
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  Dades de l'alumne
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'alumne
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ex: Maria García"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Curs
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Llar d'infants">Llar d'infants</option>
                    <option value="I3">I3</option>
                    <option value="I4">I4</option>
                    <option value="I5">I5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idioma de l'informe
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Català">Català</option>
                    <option value="Castellà">Castellà</option>
                    <option value="Anglès">Anglès</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Estructura de l'Informe
                </h3>
                <p className="text-gray-500 text-sm">
                  Organitza els blocs arrossegant-los. Cada canvi es desa
                  automàticament.
                </p>
              </div>

              <div className="min-h-[300px]">
                <div className="space-y-4">
                  {elements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-8 h-8 text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Comença el teu informe
                      </h4>
                      <p className="text-gray-500 text-sm text-center max-w-xs mb-6">
                        Primer has d'afegir un títol per organitzar els
                        continguts de l'informe
                      </p>
                      <button
                        onClick={addHeader}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-sm"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Afegir primer títol
                      </button>
                    </div>
                  ) : (
                    elements.map((element) => (
                      <div key={element.id} className="space-y-3">
                        {/* Header */}
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
                        />

                        {/* Items dentro del header */}
                        <div className="ml-8 border-l-2 border-indigo-200 pl-4">
                          {element.items && element.items.length > 0 && (
                            <div className="space-y-3 mb-3">
                              {element.items.map((item) => (
                                <DraggableBlock
                                  key={item.id}
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
                              ))}
                            </div>
                          )}

                          {/* Botó per afegir items a aquest apartat */}
                          <div className="flex gap-2">
                            <AddItemButton
                              onClick={() => addItem(element.id)}
                            />
                            <AddFreeTextButton
                              onClick={() => addFreeTextBlock(element.id)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Botó per afegir nou apartat */}
                  {elements.length > 0 && (
                    <AddSectionButton onClick={addHeader} />
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-end items-center">
                    <div className="flex gap-3 items-center">
                      {saveMessage && (
                        <span className="text-sm text-emerald-600 font-medium flex items-center gap-2">
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {saveMessage}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={generateReport}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-300 font-medium transition-colors"
                        title="Debug: Veure JSON"
                      >
                        JSON
                      </button>
                      <button
                        type="button"
                        onClick={saveProgress}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-sm"
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
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                        Guardar Progrés
                      </button>
                      <button
                        type="button"
                        onClick={openFinalizeModal}
                        className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors shadow-sm"
                      >
                        Finalitzar Informe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Selecciona un item d'avaluació
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Escull d'entre les categories o escriu el teu propi contingut
                </p>
              </div>
              <button
                onClick={closeItemModal}
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

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <CategorySelector
                categoriesData={categoriesData}
                availableColors={availableColors}
                onSelectItem={handleSelectItem}
              />
            </div>
          </div>
        </div>
      )}

      {showJsonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Estructura de l'informe (JSON)
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Aquesta és l'estructura en format JSON que pots copiar i
                  utilitzar
                </p>
              </div>
              <button
                onClick={closeJsonModal}
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
              <div className="bg-slate-900 rounded-lg p-4">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {jsonOutput}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeJsonModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Tancar
              </button>
              <button
                onClick={copyJson}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copiar JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onCategoriesUpdated={loadCategories}
          courseId={courseId}
        />
      )}

      <FinalizeModal
        isOpen={showFinalizeModal}
        onClose={closeFinalizeModal}
        onGenerate={navigateToGenerating}
        studentName={studentName}
        course={course}
        language={language}
        elements={elements}
      />
    </div>
  );
}

export default CreateReport;
