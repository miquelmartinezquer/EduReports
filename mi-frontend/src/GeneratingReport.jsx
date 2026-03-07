import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";

function GeneratingReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportData = location.state?.reportData || null;
  const studentId = location.state?.studentId;
  const courseId = location.state?.courseId;
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  // Funció que crida al backend per generar l'informe amb IA
  const callAI = async (data) => {
    try {
      const jsonData = await fetchWithAuth("/reports/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportData: data }),
      });
      return jsonData;
    } catch (fetchError) {
      console.error("Error detallat:", fetchError);
      throw new Error(
        fetchError.message || "Error desconegut generant l'informe",
      );
    }
  };

  useEffect(() => {
    if (!reportData) return;

    // Actualitzar la barra de progrés
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Màxim 95% fins que acabi
        return prev + 2;
      });
    }, 100);

    // Cridar la IA i navegar quan acabi
    callAI(reportData)
      .then((aiResponse) => {
        clearInterval(progressInterval);
        setProgress(100);
        navigate("/generated-report", {
          state: {
            reportData,
            aiResponse,
            studentId,
            courseId,
          },
        });
      })
      .catch((err) => {
        clearInterval(progressInterval);
        setError(err.message);
      });

    return () => clearInterval(progressInterval);
  }, [reportData, navigate]);

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <NavBar />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Generant Informe
              </h1>
              <p className="text-gray-500 mt-1">
                El teu informe s'està processant...
              </p>
            </div>
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              ← Tornar
            </button>
          </div>

          {error ? (
            <div className="space-y-6">
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
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">
                    Error generant l'informe
                  </h3>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={handleBack}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Tornar a intentar
              </button>
            </div>
          ) : reportData ? (
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

              <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white animate-pulse">
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
                <div className="flex-1">
                  <h3 className="font-semibold text-indigo-800">
                    Processant amb IA...
                  </h3>
                  <p className="text-sm text-indigo-600 mb-2">
                    Analitzant {reportData.sections?.length || 0} seccions
                  </p>
                  <div className="w-full bg-indigo-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden opacity-50">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-700">
                    Estructura de l'informe
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

export default GeneratingReport;
