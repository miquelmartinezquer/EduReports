import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

function ReportView() {
  const { reportId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableHtml, setEditableHtml] = useState("");
  const editableContentRef = useRef(null);

  const courseId = searchParams.get("courseId");
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    loadReport();
  }, [reportId]);

  useEffect(() => {
    if (!isEditing || !editableContentRef.current) return;
    editableContentRef.current.innerHTML = editableHtml || "";
  }, [isEditing]);

  const loadReport = async () => {
    try {
      setLoading(true);
      console.log("📄 Carregant informe amb reportId:", reportId);
      console.log("URL completa:", `/reports/${reportId}`);
      const data = await fetchWithAuth(`/reports/${reportId}`);
      console.log("✅ Dades rebudes:", data);
      setReport(data);
      setEditableTitle(data?.title || "");
      setEditableHtml(data?.htmlContent || "");
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("❌ Error carregant informe:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async () => {
    try {
      await fetchWithAuth(
        `/courses/${courseId}/students/${studentId}/reports/${reportId}`,
        {
          method: "DELETE",
        },
      );

      toast.success("Informe eliminat correctament");
      navigate(`/cursos/${courseId}`);
    } catch (error) {
      console.error("Error eliminant informe:", error);
      toast.error("Error eliminant l'informe");
    }
  };

  const startEditing = () => {
    if (!report) return;
    setEditableTitle(report.title || "");
    setEditableHtml(report.htmlContent || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditableTitle(report?.title || "");
    setEditableHtml(report?.htmlContent || "");
    setIsEditing(false);
  };

  const saveEditedReport = async () => {
    if (!courseId) {
      toast.error("No s'ha pogut identificar el curs");
      return;
    }

    try {
      setIsSaving(true);
      const currentHtml = editableContentRef.current?.innerHTML ?? editableHtml;
      const response = await fetchWithAuth(
        `/courses/${courseId}/reports/${reportId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editableTitle,
            htmlContent: currentHtml,
          }),
        },
      );

      setReport(response.report);
      setEditableTitle(response.report?.title || editableTitle);
      setEditableHtml(response.report?.htmlContent || currentHtml);
      setIsEditing(false);
      toast.success("Informe actualitzat correctament");
    } catch (saveError) {
      console.error("Error actualitzant informe:", saveError);
      toast.error(saveError.message || "No s'ha pogut guardar l'informe");
    } finally {
      setIsSaving(false);
    }
  };

  const copyReportContent = async () => {
    try {
      const bodyHtmlToCopy = isEditing
        ? (editableContentRef.current?.innerHTML ?? editableHtml)
        : report?.htmlContent || "";

      const wrapper = document.createElement("div");
      wrapper.innerHTML = bodyHtmlToCopy;
      const htmlToCopy = wrapper.innerHTML;
      const textToCopy = wrapper.textContent || "";

      if (navigator.clipboard?.write && window.ClipboardItem) {
        const clipboardItem = new ClipboardItem({
          "text/html": new Blob([htmlToCopy], { type: "text/html" }),
          "text/plain": new Blob([textToCopy], { type: "text/plain" }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(textToCopy);
      }

      toast.success("Contingut de l'informe copiat");
    } catch (copyError) {
      console.error("Error copiant el contingut:", copyError);
      toast.error("No s'ha pogut copiar el contingut");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Carregant informe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <NavBar />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <Button
              onClick={() => navigate(`/cursos/${courseId}`)}
              variant="brand"
            >
              Tornar al Curs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <p>Informe no trobat</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            onClick={() => navigate(`/cursos/${courseId}`)}
            variant="ghost"
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ← Tornar al Curs
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  disabled={isSaving}
                >
                  Cancel·lar
                </Button>
                <Button
                  onClick={saveEditedReport}
                  variant="brand"
                  disabled={isSaving}
                >
                  {isSaving ? "Guardant..." : "Guardar canvis"}
                </Button>
              </>
            ) : (
              <Button
                onClick={startEditing}
                variant="brand"
                className="flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </Button>
            )}
            <Button
              onClick={copyReportContent}
              variant="neutral"
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16h8M8 12h8m-9 8h10a2 2 0 002-2V8a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293l-1.414-1.414A1 1 0 0010.586 4H7a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Copiar informe
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="danger" className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar informe?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Aquesta acció eliminara l'informe de manera permanent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={deleteReport}
                  >
                    Si, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Info del informe */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="text-2xl font-bold text-gray-900 mb-2 w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {report.title}
                </h1>
              )}
              <p className="text-sm text-gray-600">
                Creat el{" "}
                {new Date(report.createdAt).toLocaleDateString("ca-ES")}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                report.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {report.status === "completed" ? "Completat" : "Esborrany"}
            </span>
          </div>
        </div>

        {/* Contingut de l'informe */}
        <div className="bg-white rounded-lg shadow p-8">
          <div
            ref={editableContentRef}
            className={`prose max-w-none ${
              isEditing
                ? "outline-none border border-indigo-200 rounded-lg p-3"
                : ""
            }`}
            contentEditable={isEditing}
            suppressContentEditableWarning
            dangerouslySetInnerHTML={
              isEditing ? undefined : { __html: report.htmlContent }
            }
          />
          {isEditing && (
            <p className="text-xs text-gray-500 mt-3">
              Mode edició actiu: fes clic al contingut per editar-lo
              directament.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportView;
