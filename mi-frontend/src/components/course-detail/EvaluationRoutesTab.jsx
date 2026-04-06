import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import fetchWithAuth from "../../utils/fetchWithAuth";

function EvaluationRoutesTab({
  courseId,
  courseName,
  onEvaluationRoutesCountChange,
}) {
  const navigate = useNavigate();
  const [evaluationRoutes, setEvaluationRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingRouteId, setDeletingRouteId] = useState(null);
  const [routeToDelete, setRouteToDelete] = useState(null);

  const sortedEvaluationRoutes = useMemo(() => {
    return [...evaluationRoutes].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [evaluationRoutes]);

  const formatDate = (isoDate) => {
    if (!isoDate) return "-";
    return new Date(isoDate).toLocaleDateString("ca-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadEvaluationRoutes = async () => {
    if (!courseId) {
      setEvaluationRoutes([]);
      onEvaluationRoutesCountChange?.(0);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchWithAuth(
        `/courses/${courseId}/evaluation-routes`,
      );
      const nextRoutes = Array.isArray(data) ? data : [];
      setEvaluationRoutes(nextRoutes);
      onEvaluationRoutesCountChange?.(nextRoutes.length);
    } catch (loadError) {
      console.error("Error carregant rutes d'avaluacio:", loadError);
      setError(
        loadError.message || "No s'han pogut carregar les rutes d'avaluacio",
      );
      setEvaluationRoutes([]);
      onEvaluationRoutesCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluationRoutes();
  }, [courseId]);

  const openEvaluationRouteBuilder = () => {
    const params = new URLSearchParams();
    if (courseId) {
      params.set("courseId", String(courseId));
    }
    if (courseName) {
      params.set("courseName", courseName);
    }
    navigate(`/crear-ruta-avaluacio?${params.toString()}`);
  };

  const requestDeleteRoute = (evaluationRoute) => {
    if (!courseId || !evaluationRoute?.id) return;
    setRouteToDelete(evaluationRoute);
  };

  const closeDeleteRouteModal = () => {
    if (deletingRouteId) return;
    setRouteToDelete(null);
  };

  const confirmDeleteRoute = async () => {
    if (!courseId || !routeToDelete?.id) return;

    try {
      setDeletingRouteId(routeToDelete.id);
      await fetchWithAuth(
        `/courses/${courseId}/evaluation-routes/${routeToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      setEvaluationRoutes((prev) => {
        const nextRoutes = prev.filter((t) => t.id !== routeToDelete.id);
        onEvaluationRoutesCountChange?.(nextRoutes.length);
        return nextRoutes;
      });
      setRouteToDelete(null);
    } catch (deleteError) {
      console.error("Error eliminant ruta d'avaluacio:", deleteError);
      alert(
        deleteError.message || "No s'ha pogut eliminar la ruta d'avaluacio",
      );
    } finally {
      setDeletingRouteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              Rutes d'avaluacio
            </h3>
            <p className="text-gray-600">
              Defineix preguntes i opcions de comentari per fer avaluacions guiades.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadEvaluationRoutes}
              variant="outline"
              disabled={loading}
            >
              Actualitzar
            </Button>
            <Button
              onClick={openEvaluationRouteBuilder}
              variant="brand"
              size="lg"
            >
              + Crear ruta
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Carregant rutes d'avaluacio...
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadEvaluationRoutes} variant="outline">
              Tornar a provar
            </Button>
          </div>
        ) : sortedEvaluationRoutes.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-1">
              Encara no hi ha rutes d'avaluacio
            </h4>
            <p className="text-gray-500 text-sm mb-5">
              Crea la primera ruta per al curs {courseName || "actual"}.
            </p>
            <Button onClick={openEvaluationRouteBuilder} variant="brand">
              Crear primera ruta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvaluationRoutes.map((evaluationRoute) => {
              const sectionCount = Array.isArray(evaluationRoute.sections)
                ? evaluationRoute.sections.length
                : 0;

              const rubricCount = Array.isArray(evaluationRoute.sections)
                ? evaluationRoute.sections.reduce(
                    (acc, section) =>
                      acc +
                      (Array.isArray(section.items) ? section.items.length : 0),
                    0,
                  )
                : 0;

              const optionsCount = Array.isArray(evaluationRoute.sections)
                ? evaluationRoute.sections.reduce(
                    (accSections, section) =>
                      accSections +
                      (Array.isArray(section.items)
                        ? section.items.reduce(
                            (accItems, item) =>
                              accItems +
                              (Array.isArray(item.responseOptions)
                                ? item.responseOptions.length
                                : 0),
                            0,
                          )
                        : 0),
                    0,
                  )
                : 0;

              return (
                <div
                  key={evaluationRoute.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {evaluationRoute.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {sectionCount} apartats · {rubricCount} rubriques · {optionsCount} opcions
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Actualitzada:{" "}
                        {formatDate(
                          evaluationRoute.updatedAt || evaluationRoute.createdAt,
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("courseId", String(courseId));
                          params.set("courseName", courseName || "");
                          params.set("routeId", String(evaluationRoute.id));
                          navigate(`/crear-ruta-avaluacio?${params.toString()}`);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingRouteId === evaluationRoute.id}
                        onClick={() => requestDeleteRoute(evaluationRoute)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={Boolean(routeToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteRouteModal();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ruta d'avaluacio?</AlertDialogTitle>
            <AlertDialogDescription>
              Vols eliminar la ruta{" "}
              <strong>{routeToDelete?.name}</strong>? Aquesta accio no es pot
              desfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteRouteModal}>
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteRoute}
              disabled={deletingRouteId === routeToDelete?.id}
            >
              {deletingRouteId === routeToDelete?.id
                ? "Eliminant..."
                : "Si, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EvaluationRoutesTab;
