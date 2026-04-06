import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CategorySelector from "./components/CategorySelector";
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

// sections: [{ id, title, rubrics: [{ id, title, variants }] }]

function EvaluationRouteBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseId = searchParams.get("courseId");
  const courseName = searchParams.get("courseName") || "Curs";
  const routeId = searchParams.get("routeId");

  const [sections, setSections] = useState([]);
  const [idCounter, setIdCounter] = useState(0);
  const [routeName, setRouteName] = useState("");
  const [categoriesData, setCategoriesData] = useState({});
  const [availableColors, setAvailableColors] = useState([]);

  // Which section to add a rubric to (null = none open)
  const [pickingForSectionId, setPickingForSectionId] = useState(null);
  // Inline editing of section title
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [includeConclusions, setIncludeConclusions] = useState(false);
  const [conclusionsTitle, setConclusionsTitle] = useState("Observacions finals");
  const [conclusionsGuidance, setConclusionsGuidance] = useState("");

  // ─── Data loading ─────────────────────────────────────────────────────────────

  const loadCategories = async () => {
    if (!courseId) return;
    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories`);
      setCategoriesData(data || {});
    } catch (err) {
      console.error("Error carregant categories:", err);
    }
  };

  const loadColors = async () => {
    if (!courseId) return;
    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories/colors`);
      setAvailableColors(data || []);
    } catch (err) {
      console.error("Error carregant colors:", err);
    }
  };

  const nextId = () => {
    const n = idCounter + 1;
    setIdCounter(n);
    return n;
  };

  const loadRoute = async () => {
    if (!courseId || !routeId) return;
    try {
      const route = await fetchWithAuth(
        `/courses/${courseId}/evaluation-routes/${routeId}`,
      );
      setRouteName(route.name || "");
      const loadedSections = Array.isArray(route.sections) ? route.sections : [];
      let counter = 0;
      const mapped = loadedSections.map((s) => {
        counter++;
        return {
          id: counter,
          title: s.title || "",
          rubrics: Array.isArray(s.rubrics)
            ? s.rubrics.map((r) => {
                counter++;
                return {
                  id: counter,
                  title: r.title || "",
                  variants: Array.isArray(r.variants) ? r.variants : [],
                };
              })
            : [],
        };
      });
      setSections(mapped);
      setIdCounter(counter);
      setIncludeConclusions(Boolean(route.conclusions?.enabled));
      setConclusionsTitle(route.conclusions?.title?.trim() || "Observacions finals");
      setConclusionsGuidance(route.conclusions?.guidance || "");
    } catch (err) {
      console.error("Error carregant ruta:", err);
      toast.error(err.message || "No s'ha pogut carregar la ruta d'avaluació");
    }
  };

  useEffect(() => {
    loadCategories();
    loadColors();
    loadRoute();
  }, [courseId, routeId]);

  // ─── Section management ───────────────────────────────────────────────────────

  const addSection = () => {
    const newId = idCounter + 1;
    setIdCounter(newId);
    const newSection = { id: newId, title: `Apartat ${sections.length + 1}`, rubrics: [] };
    setSections((prev) => [...prev, newSection]);
    // Start editing the title immediately
    setEditingSectionId(newId);
    setEditingSectionTitle(newSection.title);
  };

  const removeSection = (sectionId) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const startEditSectionTitle = (section) => {
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
  };

  const commitSectionTitle = () => {
    if (editingSectionId == null) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === editingSectionId
          ? { ...s, title: editingSectionTitle.trim() || s.title }
          : s,
      ),
    );
    setEditingSectionId(null);
    setEditingSectionTitle("");
  };

  const moveSectionUp = (idx) => {
    if (idx === 0) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };

  const moveSectionDown = (idx) => {
    setSections((prev) => {
      if (idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };

  // ─── Rubric management ────────────────────────────────────────────────────────

  const handleSelectRubric = (rubricTitle, _categoryName, variants = []) => {
    if (pickingForSectionId == null) return;
    const newId = idCounter + 1;
    setIdCounter(newId);
    setSections((prev) =>
      prev.map((s) =>
        s.id === pickingForSectionId
          ? {
              ...s,
              rubrics: [
                ...s.rubrics,
                {
                  id: newId,
                  title: rubricTitle,
                  variants: Array.isArray(variants)
                    ? variants.map((v) => String(v || "").trim()).filter(Boolean)
                    : [],
                },
              ],
            }
          : s,
      ),
    );
    setPickingForSectionId(null);
  };

  const removeRubric = (sectionId, rubricId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, rubrics: s.rubrics.filter((r) => r.id !== rubricId) }
          : s,
      ),
    );
  };

  const moveRubricUp = (sectionId, rubricIdx) => {
    if (rubricIdx === 0) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const arr = [...s.rubrics];
        [arr[rubricIdx - 1], arr[rubricIdx]] = [arr[rubricIdx], arr[rubricIdx - 1]];
        return { ...s, rubrics: arr };
      }),
    );
  };

  const moveRubricDown = (sectionId, rubricIdx, totalRubrics) => {
    if (rubricIdx >= totalRubrics - 1) return;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const arr = [...s.rubrics];
        [arr[rubricIdx], arr[rubricIdx + 1]] = [arr[rubricIdx + 1], arr[rubricIdx]];
        return { ...s, rubrics: arr };
      }),
    );
  };

  const clearAll = () => {
    setSections([]);
    setIdCounter(0);
    setShowClearModal(false);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────────

  const buildPayload = () => ({
    name: routeName.trim(),
    courseId: courseId ? parseInt(courseId, 10) : null,
    sections: sections.map((s) => ({
      title: s.title,
      rubrics: s.rubrics.map((r) => ({ title: r.title, variants: r.variants })),
    })),
    conclusions: {
      enabled: includeConclusions,
      title: includeConclusions && conclusionsTitle.trim()
        ? conclusionsTitle.trim()
        : "Observacions finals",
      guidance: includeConclusions && conclusionsGuidance.trim()
        ? conclusionsGuidance.trim()
        : null,
    },
  });

  const saveRoute = async () => {
    if (!courseId) { toast.error("No s'ha pogut identificar el curs."); return; }
    if (!routeName.trim()) { toast.error("Posa un nom a la ruta d'avaluació."); return; }
    if (sections.length === 0) { toast.error("Afegeix almenys un apartat abans de guardar."); return; }

    const payload = buildPayload();
    try {
      setIsSaving(true);
      const url = routeId
        ? `/courses/${courseId}/evaluation-routes/${routeId}`
        : `/courses/${courseId}/evaluation-routes`;
      await fetchWithAuth(url, {
        method: routeId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setSaveMessage("Ruta guardada");
      setTimeout(() => setSaveMessage(""), 2500);
      toast.success("Ruta d'avaluació guardada correctament");
    } catch (err) {
      toast.error(err.message || "No s'ha pogut guardar la ruta d'avaluació");
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = async () => {
    if (courseId && routeName.trim() && sections.length > 0) {
      try {
        const payload = buildPayload();
        await fetchWithAuth(
          routeId
            ? `/courses/${courseId}/evaluation-routes/${routeId}`
            : `/courses/${courseId}/evaluation-routes`,
          { method: routeId ? "PUT" : "POST", body: JSON.stringify(payload) },
        );
      } catch (_) {}
    }
    navigate(courseId ? `/cursos/${courseId}` : "/");
  };

  const totalRubrics = sections.reduce((acc, s) => acc + s.rubrics.length, 0);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-5xl mx-auto pb-10 px-4">

        {/* Top bar */}
        <div className="mb-8 pt-6">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={goBack} variant="ghost" className="flex items-center gap-2 text-gray-700 hover:bg-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tornar al curs
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Creador de Rutes d'Avaluació</h1>
            <p className="text-gray-500 text-sm">Defineix apartats i assigna rubriques a cadascun</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la ruta</label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Ex: Seguiment 2n trimestre"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Curs</label>
                <input value={courseName} disabled
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 text-sm" />
              </div>

              <div className="pt-2 border-t border-gray-200 space-y-3">
                <label className="flex items-start gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={includeConclusions}
                    onChange={(e) => setIncludeConclusions(e.target.checked)} className="mt-0.5" />
                  Observacions finals
                </label>
                {includeConclusions && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Títol</label>
                      <input type="text" value={conclusionsTitle}
                        onChange={(e) => setConclusionsTitle(e.target.value)}
                        placeholder="Observacions finals"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pautes per a la IA</label>
                      <textarea value={conclusionsGuidance}
                        onChange={(e) => setConclusionsGuidance(e.target.value)}
                        placeholder="Ex: destacar l'evolució..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-20" />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400">
                {sections.length} {sections.length === 1 ? "apartat" : "apartats"} · {totalRubrics} {totalRubrics === 1 ? "rubrica" : "rubriques"}
              </p>
            </div>
          </div>

          {/* ── Main content ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Apartats de la ruta</h3>
                  <p className="text-gray-500 text-sm mt-0.5">Cada apartat agrupa varies rubriques d'avaluació</p>
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-1">Cap apartat afegit</h4>
                  <p className="text-gray-500 text-sm text-center max-w-xs mb-5">
                    Crea el primer apartat (ex: "Matemàtiques") i afegeix-hi rubriques
                  </p>
                  <Button variant="brand" onClick={addSection} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Afegir primer apartat
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {sections.map((section, sIdx) => (
                    <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">

                      {/* Section header */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                        <span className="shrink-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {sIdx + 1}
                        </span>

                        {editingSectionId === section.id ? (
                          <input
                            autoFocus
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            onBlur={commitSectionTitle}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") commitSectionTitle(); }}
                            className="flex-1 px-2 py-1 border border-indigo-300 rounded-lg text-sm font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditSectionTitle(section)}
                            className="flex-1 text-left text-sm font-semibold text-indigo-900 hover:text-indigo-600 transition-colors"
                            title="Clica per editar el nom"
                          >
                            {section.title}
                            <svg className="w-3.5 h-3.5 inline ml-1.5 text-indigo-400 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}

                        <div className="shrink-0 flex items-center gap-1">
                          <button type="button" onClick={() => moveSectionUp(sIdx)} disabled={sIdx === 0}
                            className="p-1 rounded hover:bg-indigo-100 disabled:opacity-30 transition-colors" title="Pujar apartat">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button type="button" onClick={() => moveSectionDown(sIdx)} disabled={sIdx === sections.length - 1}
                            className="p-1 rounded hover:bg-indigo-100 disabled:opacity-30 transition-colors" title="Baixar apartat">
                            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button type="button" onClick={() => removeSection(section.id)}
                            className="p-1 rounded hover:bg-red-100 text-indigo-400 hover:text-red-600 transition-colors" title="Eliminar apartat">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Rubrics list */}
                      <div className="p-4 space-y-2">
                        {section.rubrics.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-3">
                            Cap rubrica afegida. Clica el botó de sota per afegir-ne una.
                          </p>
                        )}
                        {section.rubrics.map((rubric, rIdx) => (
                          <div key={rubric.id}
                            className="flex items-start gap-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
                            <div className="shrink-0 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                              {rIdx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm leading-snug">{rubric.title}</p>
                              {rubric.variants.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {rubric.variants.map((v, vi) => (
                                    <span key={vi}
                                      className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full">
                                      Av{vi + 1}: {v}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-amber-500 mt-1">Sense avaluacions definides</p>
                              )}
                            </div>
                            <div className="shrink-0 flex items-center gap-0.5">
                              <button type="button" onClick={() => moveRubricUp(section.id, rIdx)}
                                disabled={rIdx === 0}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button type="button" onClick={() => moveRubricDown(section.id, rIdx, section.rubrics.length)}
                                disabled={rIdx === section.rubrics.length - 1}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors">
                                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button type="button" onClick={() => removeRubric(section.id, rubric.id)}
                                className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add rubric to this section */}
                        <button type="button"
                          onClick={() => setPickingForSectionId(section.id)}
                          className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg py-2 text-xs font-medium transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Afegir rubrica a "{section.title}"
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add section */}
                  <button type="button" onClick={addSection}
                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 rounded-xl py-3 text-sm font-medium transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Afegir apartat
                  </button>
                </div>
              )}

              {/* Bottom actions */}
              <div className="mt-6 pt-5 border-t border-gray-200 flex justify-end items-center gap-3">
                {saveMessage && (
                  <span className="text-sm text-emerald-600 font-medium">{saveMessage}</span>
                )}
                {sections.length > 0 && (
                  <Button variant="outline" onClick={() => setShowClearModal(true)}>Netejar</Button>
                )}
                <Button variant="brand" onClick={saveRoute} disabled={isSaving}>
                  {isSaving ? "Guardant..." : "Guardar ruta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Clear confirmation ── */}
      <AlertDialog open={showClearModal} onOpenChange={setShowClearModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Netejar ruta?</AlertDialogTitle>
            <AlertDialogDescription>
              S'esborraran tots els apartats i rubriques. Aquesta acció no es pot desfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={clearAll}>Sí, netejar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Pick rubric modal ── */}
      {pickingForSectionId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start p-6 border-b border-gray-200 shrink-0">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Triar rubrica</h3>
                <p className="text-gray-500 text-sm mt-1">
                  S'afegirà a "{sections.find((s) => s.id === pickingForSectionId)?.title}"
                </p>
              </div>
              <button onClick={() => setPickingForSectionId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <CategorySelector
                categoriesData={categoriesData}
                availableColors={availableColors}
                itemUsageMap={{}}
                onSelectItem={handleSelectRubric}
                onRemoveItem={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationRouteBuilder;
