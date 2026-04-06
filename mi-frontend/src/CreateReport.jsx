import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";
import FinalizeModal from "./components/FinalizeModal";
import { debugLog } from "./config/debug";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
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

// helpers

const getNameInitialType = (name) => {
  const first = String(name || "").trim().charAt(0).toLowerCase();
  if (!first) return "consonant";
  const vowels = new Set(["a","e","i","o","u","à","á","è","é","ê","ì","í","ï","ò","ó","ú","ü"]);
  return vowels.has(first) ? "vocal" : "consonant";
};

const SECTION_COLORS = [
  { ring: "ring-indigo-400",  dot: "bg-indigo-500",  label: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
  { ring: "ring-violet-400",  dot: "bg-violet-500",  label: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200"  },
  { ring: "ring-sky-400",     dot: "bg-sky-500",     label: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200"     },
  { ring: "ring-emerald-400", dot: "bg-emerald-500", label: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { ring: "ring-amber-400",   dot: "bg-amber-500",   label: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  { ring: "ring-rose-400",    dot: "bg-rose-500",    label: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
];
const sectionColor = (sectionIdx) => SECTION_COLORS[sectionIdx % SECTION_COLORS.length];

// Tab nav

function RubricTabs({ flatRubrics, currentIndex, onGoTo }) {
  const totalTabs = flatRubrics.length + 1;
  return (
    <div className="overflow-x-auto pb-1 mb-4">
      <div className="flex gap-1.5 min-w-max mx-auto px-1">
        {flatRubrics.map((fr, i) => {
          const col = sectionColor(fr.sectionIdx);
          const isActive = i === currentIndex;
          const isDone = fr.isDone;
          return (
            <button key={i} type="button" onClick={() => onGoTo(i)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-2 ${
                isActive
                  ? `${col.ring} ${col.dot} text-white shadow-md scale-110`
                  : isDone
                  ? `ring-transparent ${col.dot} text-white opacity-70`
                  : "ring-gray-200 bg-white text-gray-400 hover:ring-gray-300"
              }`}
              title={`${fr.sectionTitle} - ${fr.title}`}
            >
              {isDone && !isActive ? "✓" : i + 1}
            </button>
          );
        })}
        {/* Conclusions tab */}
        <button type="button" onClick={() => onGoTo(flatRubrics.length)}
          className={`px-2.5 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-2 ${
            currentIndex === flatRubrics.length
              ? "ring-emerald-400 bg-emerald-500 text-white shadow-md scale-110"
              : "ring-gray-200 bg-white text-gray-400 hover:ring-gray-300"
          }`}
          title="Observacions"
        >
          Obs
        </button>
      </div>
    </div>
  );
}

// Rubric card

function RubricCard({ flatRubric, sectionIdx, rubricIdx, evaluation, onUpdate }) {
  const col = sectionColor(sectionIdx);
  const { option, skip, freeText } = evaluation || { option: null, skip: false, freeText: "" };
  const [showFreeText, setShowFreeText] = useState(Boolean(freeText));

  const selectOption = (variant) => {
    const newOption = option === variant ? null : variant;
    onUpdate({ option: newOption, skip: false, freeText: "" });
    if (showFreeText && newOption) setShowFreeText(false);
  };

  const toggleSkip = () => {
    onUpdate({ option: null, skip: !skip, freeText: "" });
    setShowFreeText(false);
  };

  const toggleFreeText = () => {
    if (showFreeText) {
      setShowFreeText(false);
      onUpdate({ freeText: "" });
    } else {
      setShowFreeText(true);
      onUpdate({ option: null, skip: false });
    }
  };

  const onFreeTextChange = (val) => {
    onUpdate({ freeText: val, option: null, skip: false });
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-lg p-6 ${skip ? "border-gray-200 opacity-60" : col.border}`}>
      {/* Section breadcrumb */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4 ${col.bg} ${col.label}`}>
        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
        {flatRubric.sectionTitle}
        <span className="opacity-60">· {flatRubric.sectionRubricNum}/{flatRubric.totalSectionRubrics}</span>
      </div>

      {/* Rubric title */}
      <h2 className="text-lg font-bold text-gray-900 mb-5 leading-snug">{flatRubric.title}</h2>

      {/* Av options */}
      {!skip && !showFreeText && (
        <div className="space-y-2 mb-4">
          {flatRubric.variants && flatRubric.variants.length > 0 ? (
            flatRubric.variants.map((variant, vi) => {
              const isSelected = option === variant;
              return (
                <button key={vi} type="button" onClick={() => selectOption(variant)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    isSelected ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-300 text-gray-500"
                  }`}>
                    {isSelected ? "✓" : `Av${vi + 1}`}
                  </span>
                  <span className="leading-snug">{variant}</span>
                </button>
              );
            })
          ) : (
            <p className="text-xs text-amber-500 py-2">Sense avaluacions definides per a aquesta rubrica</p>
          )}
        </div>
      )}

      {/* Free text */}
      {showFreeText && !skip && (
        <div className="mb-4">
          <textarea
            value={freeText || ""}
            onChange={(e) => onFreeTextChange(e.target.value)}
            placeholder="Escriu el comentari personalitzat per a aquesta rubrica..."
            rows={3}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
      )}

      {/* Skip indicator */}
      {skip && (
        <div className="flex items-center gap-2 py-3 mb-4 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29" />
          </svg>
          <span className="text-sm italic">No s'inclourà en l'informe</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button type="button" onClick={toggleSkip}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            skip
              ? "border-gray-400 bg-gray-100 text-gray-700"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          {skip ? "Desfer omissió" : "No parlar-ne"}
        </button>

        {!skip && (
          <button type="button" onClick={toggleFreeText}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              showFreeText
                ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {showFreeText ? "Amagar text lliure" : "Text lliure"}
          </button>
        )}
      </div>
    </div>
  );
}

// Conclusions tab

function ConclusionsTab({ includeConclusions, onToggle, conclusionsTitle, onTitleChange, conclusionsGuidance, onGuidanceChange }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-lg p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">Última pestanya</p>
        <h2 className="text-xl font-bold text-gray-900">Apartat d'observacions</h2>
        <p className="text-sm text-gray-500 mt-1">Tria si vols incloure un apartat final d'observacions a l'informe</p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all mb-4">
        <input type="checkbox" checked={includeConclusions}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-0.5 w-5 h-5 rounded accent-emerald-600 cursor-pointer" />
        <div>
          <p className="font-semibold text-gray-900 text-sm">Incloure apartat d'observacions a l'informe</p>
          <p className="text-xs text-gray-500 mt-0.5">La IA generarà un apartat final de valoració general</p>
        </div>
      </label>

      {includeConclusions && (
        <div className="space-y-3 pl-2 border-l-2 border-emerald-200 ml-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Títol de l'apartat</label>
            <input type="text" value={conclusionsTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Observacions finals"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Pautes per a la IA <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea value={conclusionsGuidance}
              onChange={(e) => onGuidanceChange(e.target.value)}
              placeholder="Ex: posa l'accent en la socialització i els hàbits..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-400" />
          </div>
        </div>
      )}
    </div>
  );
}

// Main component

function CreateReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");

  const [studentName, setStudentName] = useState(searchParams.get("studentName") || "");
  const [studentGender] = useState(searchParams.get("studentGender") || "no_indicat");
  const [course, setCourse] = useState(searchParams.get("courseName") || "I3");
  const [language, setLanguage] = useState("Català");

  const [evaluationRoutes, setEvaluationRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [wizardIndex, setWizardIndex] = useState(0);

  const [includeConclusions, setIncludeConclusions] = useState(false);
  const [conclusionsTitle, setConclusionsTitle] = useState("Observacions finals");
  const [conclusionsGuidance, setConclusionsGuidance] = useState("");

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStudentName, setSetupStudentName] = useState("");
  const [setupCourse, setSetupCourse] = useState("I3");
  const [setupLanguage, setSetupLanguage] = useState("Català");
  const [showRouteSelectionModal, setShowRouteSelectionModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showChangeRouteConfirm, setShowChangeRouteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Derived flat rubric list

  const flatRubrics = useMemo(() => {
    if (!selectedRoute) return [];
    return (selectedRoute.sections || []).flatMap((s, si) =>
      (s.rubrics || []).map((r, ri) => {
        const ev = evaluations[si]?.[ri] || {};
        const isDone = Boolean(ev.option) || Boolean(ev.freeText?.trim()) || Boolean(ev.skip);
        return {
          title: r.title,
          variants: r.variants || [],
          sectionIdx: si,
          rubricIdx: ri,
          sectionTitle: s.title,
          sectionRubricNum: ri + 1,
          totalSectionRubrics: s.rubrics.length,
          isDone,
        };
      })
    );
  }, [selectedRoute, evaluations]);

  const totalTabs = flatRubrics.length + 1;
  const isLastTab = wizardIndex === flatRubrics.length;
  const goToStep = (idx) => { if (idx >= 0 && idx < totalTabs) setWizardIndex(idx); };
  const currentFlatRubric = !isLastTab ? flatRubrics[wizardIndex] : null;

  const doneFlatRubrics = flatRubrics.filter((fr) => fr.isDone).length;
  const progressPct = flatRubrics.length > 0 ? Math.round((doneFlatRubrics / flatRubrics.length) * 100) : 0;

  const loadEvaluationRoutes = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoadingRoutes(true);
      const data = await fetchWithAuth(`/courses/${courseId}/evaluation-routes`);
      setEvaluationRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error carregant rutes:", err);
    } finally {
      setLoadingRoutes(false);
    }
  }, [courseId]);

  const initEvaluations = (sections) =>
    (sections || []).map((s) =>
      (s.rubrics || []).map(() => ({ option: null, skip: false, freeText: "" }))
    );

  const loadDraft = useCallback(async () => {
    if (!studentId) return false;
    try {
      const draft = await fetchWithAuth(`/drafts/${studentId}`);
      if (!draft) return false;
      debugLog("Esborrany carregat:", draft);
      if (draft.studentName) setStudentName(draft.studentName);
      if (draft.course) setCourse(draft.course);
      if (draft.language) setLanguage(draft.language);
      if (draft.conclusions) {
        setIncludeConclusions(Boolean(draft.conclusions.enabled));
        setConclusionsTitle(draft.conclusions.title?.trim() || "Observacions finals");
        setConclusionsGuidance(draft.conclusions.guidance || "");
      }
      if (draft.selectedRoute && Array.isArray(draft.selectedRoute.sections)) {
        setSelectedRoute(draft.selectedRoute);
        const restoredEvals = Array.isArray(draft.evaluations) && draft.evaluations.length > 0
          ? draft.evaluations
          : initEvaluations(draft.selectedRoute.sections);
        setEvaluations(restoredEvals);
        setWizardIndex(typeof draft.wizardIndex === "number" ? draft.wizardIndex : 0);
        return true;
      }
      return false;
    } catch (err) {
      debugLog("No s'ha trobat cap esborrany:", err.message);
      return false;
    }
  }, [studentId]);

  useEffect(() => {
    const init = async () => {
      await loadEvaluationRoutes();
      const hasDraft = await loadDraft();
      if (!hasDraft) {
        setSetupStudentName(searchParams.get("studentName") || "");
        setSetupCourse(searchParams.get("courseName") || "I3");
        setShowSetupModal(true);
      }
    };
    init();
  }, [courseId]);

  useEffect(() => {
    const locked = showSetupModal || showRouteSelectionModal;
    document.body.style.overflow = locked ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showSetupModal, showRouteSelectionModal]);

  const persistDraft = useCallback(async (data, silent = true) => {
    if (!studentId) return;
    try {
      await fetchWithAuth(`/drafts/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!silent) toast.success("Esborrany guardat");
    } catch (err) {
      console.error("Error auto-guardant:", err);
      if (!silent) toast.error("Error guardant l'esborrany");
    }
  }, [studentId]);

  useEffect(() => {
    if (!selectedRoute || showSetupModal || showRouteSelectionModal) return;
    const id = setTimeout(() => {
      persistDraft({
        studentName, course, language,
        selectedRoute, evaluations, wizardIndex,
        conclusions: { enabled: includeConclusions, title: conclusionsTitle, guidance: conclusionsGuidance },
      });
    }, 1500);
    return () => clearTimeout(id);
  }, [studentName, course, language, evaluations, wizardIndex,
    includeConclusions, conclusionsTitle, conclusionsGuidance, selectedRoute]);

  const confirmSetup = () => {
    setStudentName(setupStudentName);
    setCourse(setupCourse);
    setLanguage(setupLanguage);
    setShowSetupModal(false);
    setShowRouteSelectionModal(true);
  };

  const selectRoute = (route) => {
    const sections = Array.isArray(route.sections) ? route.sections : [];
    setSelectedRoute({ id: route.id, name: route.name, sections, conclusions: route.conclusions || {} });
    if (route.conclusions?.enabled) {
      setIncludeConclusions(true);
      setConclusionsTitle(route.conclusions.title || "Observacions finals");
      setConclusionsGuidance(route.conclusions.guidance || "");
    }
    setEvaluations(initEvaluations(sections));
    setWizardIndex(0);
    setShowRouteSelectionModal(false);
  };

  const updateEval = useCallback((sectionIdx, rubricIdx, changes) => {
    setEvaluations((prev) =>
      prev.map((sectionEvals, si) =>
        si === sectionIdx
          ? sectionEvals.map((ev, ri) => (ri === rubricIdx ? { ...ev, ...changes } : ev))
          : sectionEvals
      )
    );
  }, []);

  const buildReportData = () => ({
    student: {
      name: "STUDENT_NAME",
      nameInitialType: getNameInitialType(studentName),
      gender: studentGender,
      date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
      course,
      language,
    },
    sections: (selectedRoute?.sections || []).map((section, si) => {
      const sectionEvals = evaluations[si] || [];
      const items = (section.rubrics || [])
        .map((rubric, ri) => {
          const ev = sectionEvals[ri] || {};
          if (ev.skip) return null;
          const selectedOption = ev.option || null;
          const freeText = ev.freeText?.trim() || null;
          return {
            prompt: rubric.title,
            availableOptions: rubric.variants || [],
            selectedOption,
            freeTextComment: freeText,
            evaluationStatus: selectedOption || freeText ? "evaluated" : "pending",
            content: selectedOption || freeText || "No avaluat",
          };
        })
        .filter(Boolean);
      return { type: "section", title: section.title, items };
    }),
    conclusions: {
      enabled: includeConclusions,
      title: conclusionsTitle.trim() || "Observacions finals",
      guidance: conclusionsGuidance.trim() || null,
    },
  });

  const buildFinalizeElements = () =>
    (selectedRoute?.sections || []).map((section, si) => ({
      id: `s-${si}`,
      content: section.title,
      items: (section.rubrics || []).flatMap((rubric, ri) => {
        const ev = evaluations[si]?.[ri] || {};
        if (ev.skip) return []; // excluded — don't show in review
        let valueText;
        if (ev.option) valueText = ev.option;
        else if (ev.freeText?.trim()) valueText = ev.freeText.trim();
        else valueText = "(Sense avaluar)";
        return [{ id: `r-${si}-${ri}`, content: `${rubric.title}: ${valueText}` }];
      }),
    }));

  const navigateToGenerating = () => {
    setShowFinalizeModal(false);
    navigate("/generating-report", {
      state: { reportData: buildReportData(), studentName: studentName.trim(), studentId, courseId },
    });
  };

  const goBackToCourse = async () => {
    if (selectedRoute && studentId) {
      const toastId = toast.loading("Guardant esborrany...");
      await persistDraft({
        studentName, course, language,
        selectedRoute, evaluations, wizardIndex,
        conclusions: { enabled: includeConclusions, title: conclusionsTitle, guidance: conclusionsGuidance },
      });
      toast.dismiss(toastId);
      toast.success("Esborrany guardat");
    }
    navigate(courseId ? `/cursos/${courseId}` : "/");
  };

  const confirmChangeRoute = () => {
    setShowChangeRouteConfirm(false);
    setShowRouteSelectionModal(true);
  };

  const confirmDiscard = async () => {
    setShowDiscardConfirm(false);
    const toastId = toast.loading("Eliminant esborrany...");
    try {
      if (studentId) await fetchWithAuth(`/drafts/${studentId}`, { method: "DELETE" });
      toast.dismiss(toastId);
      toast.success("Esborrany eliminat");
    } catch (_) {
      toast.dismiss(toastId);
    }
    navigate(courseId ? `/cursos/${courseId}` : "/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <NavBar />

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Nou informe</h2>
              <p className="text-gray-500 text-sm mt-1">Omple les dades de l'alumne per començar</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'alumne <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={setupStudentName}
                  onChange={searchParams.get("studentName") ? undefined : (e) => setSetupStudentName(e.target.value)}
                  readOnly={!!searchParams.get("studentName")}
                  onKeyDown={(e) => e.key === "Enter" && setupStudentName.trim() && confirmSetup()}
                  placeholder="Ex: Maria García"
                  autoFocus={!searchParams.get("studentName")}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    searchParams.get("studentName")
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-default"
                      : "border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivell</label>
                <select value={setupCourse} onChange={(e) => setSetupCourse(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                  <option value="Llar d'infants">Llar d'infants</option>
                  <option value="I3">I3</option>
                  <option value="I4">I4</option>
                  <option value="I5">I5</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma de l'informe</label>
                <select value={setupLanguage} onChange={(e) => setSetupLanguage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500">
                  <option value="Català">Català</option>
                  <option value="Castellà">Castellà</option>
                  <option value="Anglès">Anglès</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1"
                onClick={() => navigate(courseId ? `/cursos/${courseId}` : "/")}>
                Cancel·lar
              </Button>
              <Button variant="brand" className="flex-1"
                disabled={!setupStudentName.trim()} onClick={confirmSetup}>
                Continuar →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Route Selection Modal */}
      {showRouteSelectionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Triar ruta d'avaluació</h2>
              <p className="text-gray-500 text-sm mt-1">
                Per a <strong>{studentName || setupStudentName}</strong>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingRoutes ? (
                <p className="text-center text-gray-400 py-8">Carregant rutes...</p>
              ) : evaluationRoutes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No hi ha rutes d'avaluació per a aquest curs.</p>
                  <Button variant="brand"
                    onClick={() => navigate(courseId ? `/cursos/${courseId}` : "/")}>
                    Crear una ruta primer
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluationRoutes.map((route) => {
                    const sectionCount = Array.isArray(route.sections) ? route.sections.length : 0;
                    const rubricCount = (route.sections || []).reduce((a, s) => a + (s.rubrics?.length || 0), 0);
                    return (
                      <button key={route.id} type="button" onClick={() => selectRoute(route)}
                        className="w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{route.name}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {sectionCount} {sectionCount === 1 ? "apartat" : "apartats"} · {rubricCount} {rubricCount === 1 ? "rubrica" : "rubriques"}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 shrink-0">
              <Button variant="outline" className="w-full"
                onClick={() => { setShowRouteSelectionModal(false); setShowSetupModal(true); }}>
                ← Tornar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main wizard */}
      {selectedRoute && !showSetupModal && !showRouteSelectionModal && (
        <div className="max-w-2xl mx-auto px-4 pb-10 pt-6">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={goBackToCourse} className="text-gray-600 flex items-center gap-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tornar
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">{studentName}</p>
              <p className="text-xs text-gray-400">{selectedRoute.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs text-gray-500"
                onClick={() => setShowChangeRouteConfirm(true)}>
                Canviar ruta
              </Button>
              <Button variant="outline" size="sm"
                className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => setShowDiscardConfirm(true)}>
                Descartar
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">{doneFlatRubrics}/{flatRubrics.length} rubriques ({progressPct}%)</p>
            <p className="text-xs text-gray-400">{course} · {language}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>

          {/* Tabs */}
          <RubricTabs flatRubrics={flatRubrics} currentIndex={wizardIndex} onGoTo={goToStep} />

          {/* Card */}
          {!isLastTab && currentFlatRubric ? (
            <RubricCard              key={wizardIndex}              flatRubric={currentFlatRubric}
              sectionIdx={currentFlatRubric.sectionIdx}
              rubricIdx={currentFlatRubric.rubricIdx}
              evaluation={evaluations[currentFlatRubric.sectionIdx]?.[currentFlatRubric.rubricIdx]}
              onUpdate={(changes) => updateEval(currentFlatRubric.sectionIdx, currentFlatRubric.rubricIdx, changes)}
            />
          ) : (
            <ConclusionsTab
              includeConclusions={includeConclusions}
              onToggle={setIncludeConclusions}
              conclusionsTitle={conclusionsTitle}
              onTitleChange={setConclusionsTitle}
              conclusionsGuidance={conclusionsGuidance}
              onGuidanceChange={setConclusionsGuidance}
            />
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between mt-5">
            <Button variant="outline" onClick={() => goToStep(wizardIndex - 1)}
              disabled={wizardIndex === 0} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </Button>

            {!isLastTab ? (
              <Button variant="brand" onClick={() => goToStep(wizardIndex + 1)}
                className="flex items-center gap-2">
                Següent
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            ) : (
              <Button onClick={() => setShowFinalizeModal(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2 rounded-lg">
                Revisar i generar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Change route confirm */}
      <AlertDialog open={showChangeRouteConfirm} onOpenChange={setShowChangeRouteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Canviar ruta d'avaluació?</AlertDialogTitle>
            <AlertDialogDescription>
              Es perdran totes les avaluacions actuals d'aquesta ruta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangeRoute}>Canviar igualment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard confirm */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar l'informe?</AlertDialogTitle>
            <AlertDialogDescription>
              S'eliminarà l'esborrany guardat i es perdrà tot el progrés actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDiscard}>Eliminar i sortir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize modal */}
      <FinalizeModal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        onGenerate={navigateToGenerating}
        studentName={studentName}
        course={course}
        language={language}
        elements={selectedRoute ? buildFinalizeElements() : []}
        includeConclusions={includeConclusions}
        conclusionsTitle={conclusionsTitle}
        conclusionsGuidance={conclusionsGuidance}
      />
    </div>
  );
}

export default CreateReport;
