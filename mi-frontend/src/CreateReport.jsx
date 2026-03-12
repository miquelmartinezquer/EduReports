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

function CreateReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [elements, setElements] = useState([]);
  const [elementCounter, setElementCounter] = useState(0);
  const [draggedElement, setDraggedElement] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showStartTemplateModal, setShowStartTemplateModal] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [showDeleteReportModal, setShowDeleteReportModal] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);
  const [pendingDeleteHeader, setPendingDeleteHeader] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [jsonOutput, setJsonOutput] = useState("");
  const [categoriesData, setCategoriesData] = useState({});
  const [availableColors, setAvailableColors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [includeConclusions, setIncludeConclusions] = useState(false);
  const [conclusionsTitle, setConclusionsTitle] = useState(
    "Observacions finals",
  );
  const [conclusionsGuidance, setConclusionsGuidance] = useState("");

  // Dades de l'alumne
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");
  const [studentName, setStudentName] = useState(
    searchParams.get("studentName") || "",
  );
  const [studentGender] = useState(
    searchParams.get("studentGender") || "no_indicat",
  );
  const [course, setCourse] = useState(searchParams.get("courseName") || "I3");
  const [language, setLanguage] = useState("Català");

  const getNameInitialType = (name) => {
    const firstLetter = String(name || "")
      .trim()
      .charAt(0)
      .toLowerCase();
    if (!firstLetter) return "consonant";

    const vowels = new Set([
      "a",
      "e",
      "i",
      "o",
      "u",
      "à",
      "á",
      "è",
      "é",
      "ê",
      "ì",
      "í",
      "ï",
      "ò",
      "ó",
      "ú",
      "ü",
    ]);
    return vowels.has(firstLetter) ? "vocal" : "consonant";
  };

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
    if (!studentId) return false; // No carregar si no hi ha studentId

    console.log("Intentant carregar esborrany per studentId:", studentId);

    try {
      const draft = await fetchWithAuth(`/drafts/${studentId}`);

      console.log("Esborrany carregat:", draft);

      if (draft) {
        // Migrar datos antiguos a la nueva estructura si es necesario
        const migratedElements = draft.elements.map((el) => {
          if (el.type === "header" && !el.items) {
            return {
              ...el,
              items: [],
              isConclusion: Boolean(el.isConclusion),
              conclusionGuidance: el.conclusionGuidance || "",
            };
          }
          if (el.type === "header") {
            return {
              ...el,
              isConclusion: Boolean(el.isConclusion),
              conclusionGuidance: el.conclusionGuidance || "",
            };
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
        setIncludeConclusions(Boolean(draft.conclusions?.enabled));
        setConclusionsTitle(
          draft.conclusions?.title?.trim() || "Observacions finals",
        );
        setConclusionsGuidance(draft.conclusions?.guidance || "");
        return true;
      }

      return false;
    } catch (error) {
      // Si no hi ha esborrany (404) o error, no passa res
      console.log(
        "No s'ha trobat cap esborrany per aquest alumne:",
        error.message,
      );
      return false;
    }
  };

  const loadTemplates = async () => {
    if (!courseId) {
      setTemplates([]);
      return;
    }

    try {
      setLoadingTemplates(true);
      setTemplateLoadError("");
      const data = await fetchWithAuth(`/courses/${courseId}/templates`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error carregant plantilles:", error);
      setTemplateLoadError(
        error.message || "No s'han pogut carregar les plantilles",
      );
      setTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const applyTemplate = async (template) => {
    const sections = Array.isArray(template?.sections) ? template.sections : [];
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
        };
      });

      rebuiltElements.push({
        id: headerId,
        type: "header",
        content: section.title || "",
        order: rebuiltElements.length + 1,
        items: mappedItems,
        isConclusion: false,
        conclusionGuidance: "",
      });
    });

    setElements(rebuiltElements);
    setElementCounter(counter);
    const templateConclusions = template?.conclusions || {};
    const nextIncludeConclusions = Boolean(templateConclusions.enabled);
    const nextConclusionsTitle =
      templateConclusions.title?.trim() || "Observacions finals";
    const nextConclusionsGuidance = templateConclusions.guidance || "";

    setIncludeConclusions(nextIncludeConclusions);
    setConclusionsTitle(nextConclusionsTitle);
    setConclusionsGuidance(nextConclusionsGuidance);
    setShowStartTemplateModal(false);

    const wasSaved = await saveProgressToBackend(true, {
      elements: rebuiltElements,
      elementCounter: counter,
      conclusions: {
        enabled: nextIncludeConclusions,
        title: nextConclusionsTitle,
        guidance: nextConclusionsGuidance,
      },
    });

    setSaveMessage(
      wasSaved
        ? `Plantilla "${template.name}" carregada i guardada`
        : `Plantilla "${template.name}" carregada`,
    );
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const startBlankReport = () => {
    setShowStartTemplateModal(false);
  };

  const persistDraft = async (draftData, isSilent = false) => {
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

      return true;
    } catch (error) {
      console.error("Error guardant el progrés:", error);
      if (!isSilent) {
        alert("Error guardant el progrés");
      }
      return false;
    }
  };

  const saveProgressToBackend = async (isSilent = false, overrides = {}) => {
    if (!studentId) {
      if (!isSilent) {
        alert("No es pot guardar: falta l'identificador de l'alumne");
      }
      console.warn("No es pot guardar: falta studentId");
      return false;
    }

    const draftData = {
      courseId,
      elements,
      studentName,
      course,
      language,
      elementCounter,
      conclusions: {
        enabled: includeConclusions,
        title: conclusionsTitle,
        guidance: conclusionsGuidance,
      },
      ...overrides,
    };

    return persistDraft(draftData, isSilent);
  };

  const saveProgress = () => {
    saveProgressToBackend(false);
  };

  // Inicialitzar dades del curs
  useEffect(() => {
    const initializeData = async () => {
      await loadCategories();
      await loadColors();
      await loadTemplates();
      const hasDraft = await loadState();
      if (!hasDraft) {
        setShowStartTemplateModal(true);
      }
    };

    initializeData();
  }, [courseId]);

  // Auto-save amb useEffect - guardar al backend
  useEffect(() => {
    if (showStartTemplateModal) return;
    if (!studentId) return; // No guardar si no hi ha studentId

    // Debounce: espera 2s després de l'últim canvi per guardar
    const timeoutId = setTimeout(() => {
      console.log("Auto-guardant esborrany al backend...");
      saveProgressToBackend(true); // true = auto-save silenciós
    }, 2000);

    return () => clearTimeout(timeoutId); // Cleanup
  }, [
    elements,
    studentName,
    course,
    language,
    elementCounter,
    includeConclusions,
    conclusionsTitle,
    conclusionsGuidance,
    studentId,
  ]);

  // Bloquejar scroll quan els modals estan oberts
  useEffect(() => {
    if (
      showItemModal ||
      showCategoryManager ||
      showFinalizeModal ||
      showStartTemplateModal
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup quan el component es desmunta
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    showItemModal,
    showCategoryManager,
    showFinalizeModal,
    showStartTemplateModal,
  ]);

  const addHeader = () => {
    const newCounter = elementCounter + 1;
    const newElement = {
      id: `element-${newCounter}`,
      type: "header",
      content: "",
      order: newCounter,
      items: [], // Array para contener los items de esta sección
      isConclusion: false,
      conclusionGuidance: "",
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

  const requestDeleteSection = (headerId) => {
    const header = elements.find((el) => el.id === headerId);
    if (!header) return;

    setPendingDeleteHeader({
      id: header.id,
      title: header.content?.trim() || "(sense títol)",
      itemCount: Array.isArray(header.items) ? header.items.length : 0,
    });
    setShowDeleteSectionModal(true);
  };

  const closeDeleteSectionModal = () => {
    setShowDeleteSectionModal(false);
    setPendingDeleteHeader(null);
  };

  const confirmDeleteSection = () => {
    if (!pendingDeleteHeader?.id) return;
    removeElement(pendingDeleteHeader.id);
    closeDeleteSectionModal();
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
        name: "STUDENT_NAME",
        nameInitialType: getNameInitialType(studentName),
        gender: studentGender,
        date: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        course: course,
        language: language,
      },
      sections: sections,
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
        studentName: studentName.trim(),
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

  const closeDeleteReportModal = () => {
    if (deletingReport) return;
    setShowDeleteReportModal(false);
  };

  const goBackToCourse = () => {
    navigate(courseId ? `/cursos/${courseId}` : "/");
  };

  const deleteReportAndBack = async () => {
    try {
      setDeletingReport(true);

      if (studentId) {
        await fetchWithAuth(`/drafts/${studentId}`, {
          method: "DELETE",
        });
      }

      goBackToCourse();
    } catch (error) {
      // Si no hi ha esborrany, igualment tornem al curs.
      if (
        String(error?.message || "")
          .toLowerCase()
          .includes("no s'ha trobat cap esborrany")
      ) {
        goBackToCourse();
        return;
      }

      console.error("Error eliminant informe:", error);
      alert(error.message || "No s'ha pogut eliminar l'informe");
    } finally {
      setDeletingReport(false);
      setShowDeleteReportModal(false);
    }
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
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate(courseId ? `/cursos/${courseId}` : "/")}
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
              Tornar als Cursos
            </Button>
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
                        placeholder="Ex: destacar autonomia i actitud positiva"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-24"
                      />
                    </div>
                  )}
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

              <div className="min-h-75">
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
                      <Button
                        onClick={addHeader}
                        variant="brand"
                        size="lg"
                        className="flex items-center gap-2"
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
                      </Button>
                    </div>
                  ) : (
                    elements.map((element) => {
                      return (
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
                            onRemove={requestDeleteSection}
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
                      );
                    })
                  )}

                  {/* Botó per afegir nou apartat */}
                  {elements.length > 0 && (
                    <AddSectionButton onClick={addHeader} />
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      onClick={() => setShowDeleteReportModal(true)}
                      variant="destructive"
                    >
                      Borrar Informe
                    </Button>
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
                      <Button
                        type="button"
                        onClick={generateReport}
                        variant="outline"
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded border border-gray-300 font-medium transition-colors"
                        title="Debug: Veure JSON"
                      >
                        JSON
                      </Button>
                      <Button
                        type="button"
                        onClick={saveProgress}
                        variant="brand"
                        className="flex items-center gap-2"
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
                      </Button>
                      <Button
                        type="button"
                        onClick={openFinalizeModal}
                        variant="success"
                        className="px-8"
                      >
                        Finalitzar Informe
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        open={showDeleteSectionModal}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteSectionModal();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar apartat?</AlertDialogTitle>
            <AlertDialogDescription>
              S'eliminara l'apartat{" "}
              <strong>{pendingDeleteHeader?.title}</strong>
              {pendingDeleteHeader?.itemCount > 0 && (
                <>
                  {" "}
                  juntament amb <strong>
                    {pendingDeleteHeader.itemCount}
                  </strong>{" "}
                  {pendingDeleteHeader.itemCount === 1
                    ? "item associat"
                    : "items associats"}
                  .
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteSectionModal}>
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteSection}
            >
              Si, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteReportModal}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteReportModal();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrar informe?</AlertDialogTitle>
            <AlertDialogDescription>
              S'eliminara l'esborrany d'aquest informe i tornaras al curs.
              Aquesta accio no es pot desfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteReportModal}>
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={deleteReportAndBack}
              disabled={deletingReport}
            >
              {deletingReport ? "Eliminant..." : "Si, borrar informe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showStartTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Com vols començar l'informe?
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Tria una plantilla existent o crea un informe buit.
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingTemplates ? (
                <p className="text-sm text-gray-500">Carregant plantilles...</p>
              ) : templateLoadError ? (
                <div className="space-y-3">
                  <p className="text-sm text-red-600">{templateLoadError}</p>
                  <Button variant="outline" onClick={loadTemplates}>
                    Tornar a carregar plantilles
                  </Button>
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hi ha plantilles disponibles en aquest curs.
                </p>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => {
                    const sectionCount = Array.isArray(template.sections)
                      ? template.sections.length
                      : 0;
                    const itemCount = Array.isArray(template.sections)
                      ? template.sections.reduce(
                          (acc, section) =>
                            acc +
                            (Array.isArray(section.items)
                              ? section.items.length
                              : 0),
                          0,
                        )
                      : 0;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        onClick={() => applyTemplate(template)}
                      >
                        <p className="font-semibold text-gray-900">
                          {template.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {sectionCount} apartats · {itemCount} items
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button variant="brand" onClick={startBlankReport}>
                Crear informe buit
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <Button
                onClick={closeItemModal}
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
              <Button
                onClick={closeJsonModal}
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
              <div className="bg-slate-900 rounded-lg p-4">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {jsonOutput}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button
                onClick={closeJsonModal}
                variant="outline"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Tancar
              </Button>
              <Button
                onClick={copyJson}
                variant="brand"
                className="flex items-center gap-2"
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
              </Button>
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
        includeConclusions={includeConclusions}
        conclusionsTitle={conclusionsTitle}
        conclusionsGuidance={conclusionsGuidance}
      />
    </div>
  );
}

export default CreateReport;
