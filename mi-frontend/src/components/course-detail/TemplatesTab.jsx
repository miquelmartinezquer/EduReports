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

function TemplatesTab({ courseId, courseName }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [templates]);

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

  const loadTemplates = async () => {
    if (!courseId) {
      setTemplates([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await fetchWithAuth(`/courses/${courseId}/templates`);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error("Error carregant plantilles:", loadError);
      setError(loadError.message || "No s'han pogut carregar les plantilles");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [courseId]);

  const openTemplateBuilder = () => {
    const params = new URLSearchParams();
    if (courseId) {
      params.set("courseId", String(courseId));
    }
    if (courseName) {
      params.set("courseName", courseName);
    }
    navigate(`/crear-plantilla?${params.toString()}`);
  };

  const requestDeleteTemplate = (template) => {
    if (!courseId || !template?.id) return;
    setTemplateToDelete(template);
  };

  const closeDeleteTemplateModal = () => {
    if (deletingTemplateId) return;
    setTemplateToDelete(null);
  };

  const confirmDeleteTemplate = async () => {
    if (!courseId || !templateToDelete?.id) return;

    try {
      setDeletingTemplateId(templateToDelete.id);
      await fetchWithAuth(
        `/courses/${courseId}/templates/${templateToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      setTemplates((prev) => prev.filter((t) => t.id !== templateToDelete.id));
      setTemplateToDelete(null);
    } catch (deleteError) {
      console.error("Error eliminant plantilla:", deleteError);
      alert(deleteError.message || "No s'ha pogut eliminar la plantilla");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              Plantilles d'informe
            </h3>
            <p className="text-gray-600">
              Plantilles reutilitzables per crear informes nous mes rapid.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={loadTemplates}
              variant="outline"
              disabled={loading}
            >
              Actualitzar
            </Button>
            <Button onClick={openTemplateBuilder} variant="brand" size="lg">
              + Crear plantilla
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="py-10 text-center text-gray-500">
            Carregant plantilles...
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadTemplates} variant="outline">
              Tornar a provar
            </Button>
          </div>
        ) : sortedTemplates.length === 0 ? (
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
              Encara no hi ha plantilles
            </h4>
            <p className="text-gray-500 text-sm mb-5">
              Crea la primera plantilla per al curs {courseName || "actual"}.
            </p>
            <Button onClick={openTemplateBuilder} variant="brand">
              Crear primera plantilla
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTemplates.map((template) => {
              const sectionCount = Array.isArray(template.sections)
                ? template.sections.length
                : 0;

              const itemCount = Array.isArray(template.sections)
                ? template.sections.reduce(
                    (acc, section) =>
                      acc +
                      (Array.isArray(section.items) ? section.items.length : 0),
                    0,
                  )
                : 0;

              return (
                <div
                  key={template.id}
                  className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {sectionCount} apartats · {itemCount} items
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Actualitzada:{" "}
                        {formatDate(template.updatedAt || template.createdAt)}
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
                          params.set("templateId", String(template.id));
                          navigate(`/crear-plantilla?${params.toString()}`);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deletingTemplateId === template.id}
                        onClick={() => requestDeleteTemplate(template)}
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
        open={Boolean(templateToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteTemplateModal();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Vols eliminar la plantilla{" "}
              <strong>{templateToDelete?.name}</strong>? Aquesta accio no es pot
              desfer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteTemplateModal}>
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteTemplate}
              disabled={deletingTemplateId === templateToDelete?.id}
            >
              {deletingTemplateId === templateToDelete?.id
                ? "Eliminant..."
                : "Si, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TemplatesTab;
