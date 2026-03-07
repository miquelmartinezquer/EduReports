import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";

function GeneratedReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportData = location.state?.reportData || null;
  const aiResponse = location.state?.aiResponse || null;
  const [savedReportId, setSavedReportId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Obtenir studentId i courseId de location.state o searchParams
  const studentId = location.state?.studentId || searchParams.get("studentId");
  const courseId = location.state?.courseId || searchParams.get("courseId");

  // Guardar l'informe automàticament quan es genera
  useEffect(() => {
    const saveReport = async () => {
      if (!aiResponse?.html || !studentId || !courseId || savedReportId) {
        return; // No guardar si falta informació o ja s'ha guardat
      }

      setSaving(true);
      setSaveError(null);

      try {
        const response = await fetchWithAuth(
          `/courses/${courseId}/students/${studentId}/reports`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: `Informe de ${reportData?.student?.name || "Alumne"} - ${reportData?.student?.date || new Date().toLocaleDateString()}`,
              htmlContent: aiResponse.html,
            }),
          },
        );

        if (response.success) {
          setSavedReportId(response.report.id);
          console.log(
            "✅ Informe guardat correctament amb ID:",
            response.report.id,
          );
          console.log("Informe complet:", response.report);

          // Eliminar l'esborrany després de guardar l'informe
          try {
            await fetchWithAuth(`/drafts/${studentId}`, {
              method: "DELETE",
            });
            console.log("Esborrany eliminat correctament");
          } catch (draftError) {
            console.error("Error eliminant esborrany:", draftError);
            // No bloquejar si falla l'eliminació de l'esborrany
          }
        }
      } catch (error) {
        console.error("Error guardant informe:", error);
        setSaveError(error.message);
      } finally {
        setSaving(false);
      }
    };

    saveReport();
  }, [aiResponse, studentId, courseId, reportData, savedReportId]);

  const handleBack = () => {
    if (courseId) {
      navigate(`/cursos/${courseId}`);
    } else {
      navigate("/");
    }
  };

  const handleViewSavedReport = () => {
    if (savedReportId) {
      const url = `/informe/${savedReportId}?studentId=${studentId}&courseId=${courseId}`;
      console.log("🔗 Navegant a:", url);
      console.log("savedReportId:", savedReportId);
      navigate(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <NavBar />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Informe Generat
              </h1>
              <p className="text-gray-500 mt-1">El teu informe està llest</p>
            </div>
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              ← Tornar a l'inici
            </button>
          </div>

          {reportData ? (
            <div className="space-y-6">
              {/* Info alumne */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {reportData.student?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {reportData.student?.name || "Alumne"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {reportData.student?.course} -{" "}
                      {reportData.student?.language}
                    </p>
                  </div>
                </div>
              </div>

              {/* Missatge d'èxit */}
              <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
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
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800">
                    Informe generat correctament
                  </h3>
                  <p className="text-sm text-green-600">
                    {reportData.sections?.length || 0} seccions processades
                  </p>
                </div>
              </div>

              {/* Estat de guardat */}
              {saving && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white animate-pulse">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      Guardant informe...
                    </h3>
                    <p className="text-sm text-blue-600">
                      Processant i desant a la base de dades
                    </p>
                  </div>
                </div>
              )}

              {savedReportId && !saving && (
                <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
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
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-800">
                      Informe guardat correctament
                    </h3>
                    <p className="text-sm text-emerald-600">
                      Ja pots accedir a l'informe des del perfil de l'alumne
                    </p>
                  </div>
                  <button
                    onClick={handleViewSavedReport}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                  >
                    Veure Informe
                  </button>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">
                      Error guardant l'informe
                    </h3>
                    <p className="text-sm text-red-600">{saveError}</p>
                  </div>
                </div>
              )}

              {aiResponse?.html && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200">
                    <h4 className="font-semibold text-indigo-700">
                      Informe Generat per IA
                    </h4>
                  </div>
                  <div className="p-4">
                    <div
                      className="bg-white"
                      dangerouslySetInnerHTML={{ __html: aiResponse.html }}
                    />
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-700">
                    Dades originals
                  </h4>
                </div>
                <div className="p-4">
                  <div className="bg-slate-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(reportData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors">
                  Descarregar PDF
                </button>
                <button className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors">
                  Enviar per correu
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                No hi ha dades de l'informe
              </h3>
              <p className="text-gray-500 mb-4">
                Torna a la pàgina principal per crear un nou informe
              </p>
              <button
                onClick={handleBack}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Crear nou informe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GeneratedReport;
