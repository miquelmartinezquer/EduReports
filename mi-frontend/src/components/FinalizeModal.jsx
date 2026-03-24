function FinalizeModal({
  isOpen,
  onClose,
  onGenerate,
  studentName,
  course,
  language,
  elements,
  includeConclusions,
  conclusionsTitle,
  conclusionsGuidance,
}) {
  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!includeConclusions) {
      const shouldContinue = window.confirm(
        "No has activat les observacions finals. Vols generar l'informe igualment?",
      );
      if (!shouldContinue) {
        return;
      }
    }
    onGenerate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Revisió final de l'informe
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Revisa l'estructura abans de generar l'informe
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
          {/* Dades de l'alumne */}
          <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Dades de l'alumne
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-emerald-700 font-medium">Nom:</span>
                <p className="text-emerald-900">
                  {studentName || "(Sense nom)"}
                </p>
              </div>
              <div>
                <span className="text-emerald-700 font-medium">Curs:</span>
                <p className="text-emerald-900">{course}</p>
              </div>
              <div>
                <span className="text-emerald-700 font-medium">Idioma:</span>
                <p className="text-emerald-900">{language}</p>
              </div>
            </div>
          </div>

          {/* Estructura de l'informe */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Estructura de l'informe ({elements.length}{" "}
              {elements.length === 1 ? "apartat" : "apartats"})
            </h4>
            <div className="space-y-4">
              {elements.map((element, idx) => (
                <div
                  key={element.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">
                        {element.content || "(Títol buit)"}
                      </h5>
                    </div>
                  </div>
                  {element.items && element.items.length > 0 ? (
                    <div className="ml-9 space-y-1.5">
                      {element.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-gray-400 mt-0.5">•</span>
                          <p className="text-gray-700 flex-1">
                            {item.content || "(Element buit)"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="ml-9 text-sm text-gray-400 italic">
                      Sense elements
                    </p>
                  )}
                </div>
              ))}

              {!includeConclusions && (
                <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-amber-600 shrink-0 mt-0.5"
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
                    <div className="flex-1">
                      <h5 className="font-semibold text-amber-900 mb-1">
                        Observacions finals desactivades
                      </h5>
                      <p className="text-sm text-amber-800">
                        No s'inclouran observacions finals a l'informe. Si vols
                        afegir-les, torna a editar i activa l'opció
                        "Observacions finals".
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {includeConclusions && (
                <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-emerald-600 text-white text-xs font-bold rounded">
                      {elements.length + 1}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-emerald-900">
                        {conclusionsTitle?.trim() || "Observacions finals"}
                      </h5>
                    </div>
                  </div>
                  {conclusionsGuidance?.trim() ? (
                    <p className="ml-9 text-sm text-emerald-900">
                      Pautes per la IA: {conclusionsGuidance.trim()}
                    </p>
                  ) : (
                    <p className="ml-9 text-sm text-emerald-800 italic">
                      Sense pautes específiques. La IA generarà les observacions
                      finals a partir de la resta de seccions.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Tornar a editar
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors shadow-sm"
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generar Informe
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinalizeModal;
