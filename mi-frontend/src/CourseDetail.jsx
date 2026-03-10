import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import CategoryFormDialog from "./components/CategoryFormDialog";
import ItemFormDialog from "./components/ItemFormDialog";
import ImportItemsDialog from "./components/ImportItemsDialog";
import ExportItemsDialog from "./components/ExportItemsDialog";
import ExpandableActionButton from "./components/ExpandableActionButton";

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("classes"); // 'classes', 'collaborators' o 'items'
  const [categories, setCategories] = useState({});
  const [studentReports, setStudentReports] = useState({}); // { studentId: report }
  const [studentDrafts, setStudentDrafts] = useState({}); // { studentId: draft }
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [availableColors, setAvailableColors] = useState([
    { key: "purple", name: "Porpra" },
    { key: "blue", name: "Blau" },
    { key: "green", name: "Verd" },
    { key: "orange", name: "Taronja" },
    { key: "red", name: "Vermell" },
    { key: "pink", name: "Rosa" },
    { key: "yellow", name: "Groc" },
    { key: "teal", name: "Jade" },
    { key: "cyan", name: "Cian" },
    { key: "indigo", name: "Indi" },
    { key: "slate", name: "Pissarra" },
    { key: "emerald", name: "Maragda" },
  ]);

  // Modals
  const [showAddCollaboratorModal, setShowAddCollaboratorModal] =
    useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [deleteClassId, setDeleteClassId] = useState(null);
  const [deleteClassNameInput, setDeleteClassNameInput] = useState("");

  // Form states
  const [newCollaborator, setNewCollaborator] = useState({
    email: "",
  });
  const [newClass, setNewClass] = useState({ name: "" });
  const [newStudent, setNewStudent] = useState({
    name: "",
    lastName: "",
    gender: "no_indicat",
    age: "",
  });

  // Category/Items states
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("purple");
  const [editingCategoryKey, setEditingCategoryKey] = useState(null);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showImportItemsDialog, setShowImportItemsDialog] = useState(false);
  const [isImportingItems, setIsImportingItems] = useState(false);
  const [showExportItemsDialog, setShowExportItemsDialog] = useState(false);
  const [isExportingItems, setIsExportingItems] = useState(false);
  const [itemCategoryKey, setItemCategoryKey] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [newItemText, setNewItemText] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    description: "",
    actionLabel: "Si, eliminar",
    action: null,
  });

  useEffect(() => {
    loadCourseDetails();
    loadCategories();
    loadAvailableColors();
    loadPendingInvitations();
  }, [courseId]);

  useEffect(() => {
    if (course?.classes) {
      loadStudentReports();
      loadStudentDrafts();
    }
  }, [course]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`/courses/${courseId}`);
      setCourse(data);
    } catch (error) {
      console.error("Error carregant curs:", error);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = ({ title, description, action, actionLabel }) => {
    setConfirmDialog({
      open: true,
      title,
      description,
      action,
      actionLabel: actionLabel || "Si, eliminar",
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({
      ...prev,
      open: false,
      action: null,
    }));
  };

  const handleConfirmDialogAction = async () => {
    try {
      if (confirmDialog.action) {
        await confirmDialog.action();
      }
    } finally {
      closeConfirmDialog();
    }
  };

  const mapInviteSendError = (rawMessage) => {
    const message = (rawMessage || "").toLowerCase();

    if (message.includes("usuario no encontrado")) {
      return "L'usuari no existeix";
    }
    if (message.includes("el usuario ya es colaborador del curso")) {
      return "Aquest usuari ja esta al grup";
    }
    if (
      message.includes("ya existe una invitación pendiente para este usuario")
    ) {
      return "Ja existeix una invitació pendent per aquest usuari";
    }
    if (message.includes("curso no encontrado")) {
      return "El curs no existeix";
    }
    if (message.includes("email i courseid són requerits")) {
      return "Falten dades per enviar la invitació";
    }

    return rawMessage || "No s'ha pogut enviar la invitació";
  };

  // Col·laboradors
  const addCollaborator = async () => {
    if (!newCollaborator.email.trim()) return;

    try {
      const data = await fetchWithAuth(`/invitations/by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newCollaborator.email,
          courseId: parseInt(courseId, 10),
        }),
      });

      if (data.invitation || data.message) {
        setNewCollaborator({ email: "" });
        setShowAddCollaboratorModal(false);
        await loadPendingInvitations();
        toast.success("Invitació enviada correctament");
      }
    } catch (error) {
      console.error("Error enviant invitació:", error);
      toast.error(mapInviteSendError(error.message));
    }
  };

  const deleteCollaborator = async (
    collaboratorId,
    { shouldLeaveCourse = false } = {},
  ) => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        if (shouldLeaveCourse) {
          toast.success("Has sortit del curs");
          navigate("/");
          return;
        }

        setCourse((prev) => ({
          ...prev,
          collaborators: prev.collaborators.filter(
            (c) => c.id !== collaboratorId,
          ),
        }));
        toast.success("Col·laborador eliminat correctament");
      }
    } catch (error) {
      console.error("Error eliminant col·laborador:", error);
      if (error.message.includes("creador")) {
        toast.error("No es pot eliminar el creador del curs");
      } else {
        toast.error("No s'ha pogut eliminar el col·laborador");
      }
    }
  };

  const requestDeleteCollaborator = (collab) => {
    const isCurrentUser = user && collab.userId === user.id;

    openConfirmDialog({
      title: isCurrentUser ? "Sortir del curs?" : "Eliminar col·laborador?",
      description: (
        <>
          {isCurrentUser ? (
            <>
              Sortiras del curs <strong>{course?.name}</strong> i perdras
              l'accés.
            </>
          ) : (
            <>
              S'eliminara el col·laborador <strong>{collab.name}</strong> del
              curs.
            </>
          )}
        </>
      ),
      action: () =>
        deleteCollaborator(collab.id, { shouldLeaveCourse: isCurrentUser }),
      actionLabel: isCurrentUser ? "Si, sortir" : "Si, eliminar",
    });
  };

  const loadPendingInvitations = async () => {
    try {
      const data = await fetchWithAuth(
        `/invitations/course/${courseId}/pending`,
      );
      setPendingInvitations(
        Array.isArray(data?.invitations) ? data.invitations : [],
      );
    } catch (error) {
      console.error("Error carregant invitacions pendents:", error);
      setPendingInvitations([]);
    }
  };

  const deletePendingInvitation = async (invitationId) => {
    try {
      const data = await fetchWithAuth(`/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (data.success) {
        setPendingInvitations((prev) =>
          prev.filter((invitation) => invitation.id !== invitationId),
        );
        toast.success("Invitació pendent eliminada");
      }
    } catch (error) {
      console.error("Error eliminant invitació pendent:", error);
      toast.error(error.message || "No s'ha pogut eliminar la invitació");
    }
  };

  const requestDeletePendingInvitation = (invitation) => {
    openConfirmDialog({
      title: "Eliminar invitació pendent?",
      description: (
        <>
          S'eliminara la invitació pendent de{" "}
          <strong>{invitation.userEmail}</strong>.
        </>
      ),
      action: () => deletePendingInvitation(invitation.id),
    });
  };

  // Classes
  const addClass = async () => {
    if (newClass.name.trim()) {
      try {
        const data = await fetchWithAuth(`/courses/${courseId}/classes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClass),
        });
        if (data.success) {
          setCourse((prev) => ({
            ...prev,
            classes: [...prev.classes, data.class],
          }));
          setNewClass({ name: "" });
          setShowAddClassModal(false);
          toast.success("Classe creada correctament");
        }
      } catch (error) {
        console.error("Error creant classe:", error);
        toast.error("No s'ha pogut crear la classe");
      }
    }
  };

  const deleteClass = async (classId) => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/classes/${classId}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        setCourse((prev) => ({
          ...prev,
          classes: prev.classes.filter((c) => c.id !== classId),
        }));
        toast.success("Classe eliminada correctament");
      }
    } catch (error) {
      console.error("Error eliminant classe:", error);
      toast.error("No s'ha pogut eliminar la classe");
    }
  };

  const openDeleteClassDialog = (classItem) => {
    setDeleteClassId(classItem.id);
    setDeleteClassNameInput("");
  };

  const closeDeleteClassDialog = () => {
    setDeleteClassId(null);
    setDeleteClassNameInput("");
  };

  const isDeleteClassNameValid = (className) => {
    return (
      deleteClassNameInput.trim().toLowerCase() ===
      (className || "").trim().toLowerCase()
    );
  };

  const genderLabel = (value) => {
    const map = {
      nen: "Nen",
      nena: "Nena",
      altre: "Altre",
      no_indicat: "No indicat",
    };
    return map[value] || "No indicat";
  };

  const studentDisplayName = (student) => {
    return [student?.name, student?.lastName].filter(Boolean).join(" ").trim();
  };

  // Alumnes
  const addStudent = async () => {
    if (newStudent.name.trim() && selectedClassId) {
      try {
        const data = await fetchWithAuth(
          `/courses/${courseId}/classes/${selectedClassId}/students`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newStudent.name,
              lastName: newStudent.lastName || null,
              gender: newStudent.gender || null,
              age: newStudent.age ? parseInt(newStudent.age) : null,
            }),
          },
        );
        if (data.success) {
          setCourse((prev) => ({
            ...prev,
            classes: prev.classes.map((c) =>
              c.id === selectedClassId
                ? { ...c, students: [...c.students, data.student] }
                : c,
            ),
          }));
          setNewStudent({
            name: "",
            lastName: "",
            gender: "no_indicat",
            age: "",
          });
          setShowAddStudentModal(false);
          setSelectedClassId(null);
          toast.success("Alumne afegit correctament");
        }
      } catch (error) {
        console.error("Error afegint alumne:", error);
        toast.error("No s'ha pogut afegir l'alumne");
      }
    }
  };

  const deleteStudent = async (classId, studentId) => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/classes/${classId}/students/${studentId}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        setCourse((prev) => ({
          ...prev,
          classes: prev.classes.map((c) =>
            c.id === classId
              ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
              : c,
          ),
        }));
        toast.success("Alumne eliminat correctament");
      }
    } catch (error) {
      console.error("Error eliminant alumne:", error);
      toast.error("No s'ha pogut eliminar l'alumne");
    }
  };

  // Categories i Items
  const loadAvailableColors = async () => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/colors`,
      );
      if (Array.isArray(data) && data.length > 0) {
        setAvailableColors(
          data.map((color) => ({
            key: color.key,
            name: color.name,
          })),
        );
      }
    } catch (error) {
      console.error("Error carregant colors:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories`);
      setCategories(data);
    } catch (error) {
      console.error("Error carregant categories:", error);
    }
  };

  const loadStudentReports = async () => {
    if (!course?.classes) return;

    const reportsMap = {};
    for (const classItem of course.classes) {
      for (const student of classItem.students || []) {
        try {
          const report = await fetchWithAuth(
            `/courses/${courseId}/students/${student.id}/reports/latest`,
          );
          if (report) {
            reportsMap[student.id] = report;
          }
        } catch (error) {
          console.error(
            `Error carregant informe per alumne ${student.id}:`,
            error,
          );
        }
      }
    }
    setStudentReports(reportsMap);
  };

  const loadStudentDrafts = async () => {
    if (!course?.classes) return;

    const draftsMap = {};
    for (const classItem of course.classes) {
      for (const student of classItem.students || []) {
        try {
          const draft = await fetchWithAuth(`/drafts/${student.id}`);
          if (draft) {
            draftsMap[student.id] = draft;
          }
        } catch (error) {
          // Si no hi ha esborrany (404), no passa res
          console.log(`No hi ha esborrany per l'alumne ${student.id}`);
        }
      }
    }
    setStudentDrafts(draftsMap);
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Introdueix el nom de la categoria");
      return;
    }
    const key = newCategoryName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");

    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name: newCategoryName,
          color: newCategoryColor,
        }),
      });
      if (data.success) {
        await loadCategories();
        setShowNewCategory(false);
        setNewCategoryName("");
        setNewCategoryColor("purple");
        toast.success("Categoria creada correctament");
      }
    } catch (error) {
      console.error("Error creant categoria:", error);
      toast.error("Error creant categoria");
    }
  };

  const updateCategory = async () => {
    if (!newCategoryName.trim() || !editingCategoryKey) {
      toast.error("Introdueix el nom de la categoria");
      return;
    }

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${editingCategoryKey}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCategoryName,
            color: newCategoryColor,
          }),
        },
      );

      if (data.success) {
        await loadCategories();
        setShowNewCategory(false);
        setEditingCategoryKey(null);
        setNewCategoryName("");
        setNewCategoryColor("purple");
        toast.success("Categoria actualitzada correctament");
      }
    } catch (error) {
      console.error("Error actualitzant categoria:", error);
      toast.error("No s'ha pogut actualitzar la categoria");
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategoryKey(null);
    setNewCategoryName("");
    setNewCategoryColor("purple");
    setShowNewCategory(true);
  };

  const openEditCategoryModal = (key, category) => {
    setEditingCategoryKey(key);
    setNewCategoryName(category.name || "");
    setNewCategoryColor(category.color || "purple");
    setShowNewCategory(true);
  };

  const deleteCategory = async (key) => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${key}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        await loadCategories();
        toast.success("Categoria eliminada correctament");
      }
    } catch (error) {
      console.error("Error eliminant categoria:", error);
      toast.error("No s'ha pogut eliminar la categoria");
    }
  };

  const requestDeleteCategory = (key, categoryName) => {
    openConfirmDialog({
      title: "Eliminar categoria?",
      description: (
        <>
          S'eliminara la categoria <strong>{categoryName}</strong> amb tots els
          seus items.
        </>
      ),
      action: () => deleteCategory(key),
    });
  };

  const addItem = async (categoryKey) => {
    if (!newItemText.trim()) {
      toast.error("Introdueix el text de l'item");
      return;
    }

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${categoryKey}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: newItemText }),
        },
      );
      if (data.success) {
        await loadCategories();
        setShowItemDialog(false);
        setItemCategoryKey(null);
        setEditingItemIndex(null);
        setNewItemText("");
        toast.success("Item afegit correctament");
      }
    } catch (error) {
      console.error("Error afegint item:", error);
      toast.error("No s'ha pogut afegir l'item");
    }
  };

  const updateItem = async (categoryKey, itemIndex) => {
    if (!newItemText.trim()) {
      toast.error("Introdueix el text de l'item");
      return;
    }

    const category = categories[categoryKey];
    if (!category || !Array.isArray(category.items)) {
      toast.error("No s'ha trobat la categoria");
      return;
    }

    const updatedItems = [...category.items];
    updatedItems[itemIndex] = newItemText.trim();

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${categoryKey}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: updatedItems }),
        },
      );

      if (data.success) {
        await loadCategories();
        setShowItemDialog(false);
        setItemCategoryKey(null);
        setEditingItemIndex(null);
        setNewItemText("");
        toast.success("Item actualitzat correctament");
      }
    } catch (error) {
      console.error("Error actualitzant item:", error);
      toast.error("No s'ha pogut actualitzar l'item");
    }
  };

  const openCreateItemModal = (categoryKey) => {
    setItemCategoryKey(categoryKey);
    setEditingItemIndex(null);
    setNewItemText("");
    setShowItemDialog(true);
  };

  const openEditItemModal = (categoryKey, itemIndex, itemText) => {
    setItemCategoryKey(categoryKey);
    setEditingItemIndex(itemIndex);
    setNewItemText(itemText || "");
    setShowItemDialog(true);
  };

  const removeItem = async (categoryKey, itemIndex) => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${categoryKey}/items/${itemIndex}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        await loadCategories();
        toast.success("Item eliminat correctament");
      }
    } catch (error) {
      console.error("Error eliminant item:", error);
      toast.error("No s'ha pogut eliminar l'item");
    }
  };

  const requestRemoveItem = (categoryKey, itemIndex, itemText) => {
    openConfirmDialog({
      title: "Eliminar item?",
      description: (
        <>
          S'eliminara l'item <strong>{itemText}</strong>.
        </>
      ),
      action: () => removeItem(categoryKey, itemIndex),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
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
            <p className="text-gray-500 text-sm">Carregant curs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <p>Curs no trobat</p>
      </div>
    );
  }

  const totalItemsCount = Object.values(categories).reduce(
    (total, category) => {
      return (
        total + (Array.isArray(category?.items) ? category.items.length : 0)
      );
    },
    0,
  );

  const exportItemsCsv = async () => {
    try {
      setIsExportingItems(true);

      const response = await fetch(
        `http://localhost:3000/courses/${courseId}/categories/export/csv`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No s'ha pogut exportar els items");
      }

      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="?([^\"]+)"?/i);
      const fallbackCourseName = (course?.name || "curs")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "");
      const fileName =
        fileNameMatch?.[1] || `${fallbackCourseName || "curs"}-items.csv`;

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setShowExportItemsDialog(false);
      toast.success("Items exportats correctament");
    } catch (error) {
      console.error("Error exportant items:", error);
      toast.error(error.message || "No s'ha pogut exportar els items");
    } finally {
      setIsExportingItems(false);
    }
  };

  const importItemsData = async (importedCategories) => {
    try {
      setIsImportingItems(true);

      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories: importedCategories }),
        },
      );

      if (data.success) {
        await loadCategories();
        setShowImportItemsDialog(false);
        toast.success(
          `Importació completada: ${data.imported.categories} categories i ${data.imported.items} items`,
        );
      }
    } catch (error) {
      console.error("Error important items:", error);
      toast.error(error.message || "No s'ha pogut importar els items");
      throw error;
    } finally {
      setIsImportingItems(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-4 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ← Tornar als Cursos
          </Button>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {course.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {course.level && (
                    <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                      {course.level}
                    </span>
                  )}
                  <p className="text-gray-600">
                    Creat el{" "}
                    {new Date(course.createdAt).toLocaleDateString("ca-ES")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow">
          <div className="flex border-b">
            <Button
              onClick={() => setActiveTab("classes")}
              variant="ghost"
              className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
                activeTab === "classes"
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Classes ({course.classes?.length || 0})
            </Button>
            <Button
              onClick={() => setActiveTab("collaborators")}
              variant="ghost"
              className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
                activeTab === "collaborators"
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Col·laboradors ({course.collaborators?.length || 0})
            </Button>
            <Button
              onClick={() => setActiveTab("items")}
              variant="ghost"
              className={`flex-1 px-6 py-4 font-semibold transition-colors rounded-none ${
                activeTab === "items"
                  ? "text-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Items ({totalItemsCount})
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "classes" && (
          <div>
            <div className="mb-6">
              <Button
                onClick={() => setShowAddClassModal(true)}
                variant="brand"
                size="lg"
                className="flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Afegir Classe
              </Button>
            </div>

            <div className="space-y-4">
              {course.classes?.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hi ha cap classe encara
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Crea la primera classe per començar
                  </p>
                </div>
              ) : (
                course.classes?.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {classItem.name}
                        </h3>
                        {classItem.schedule && (
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {classItem.schedule}
                          </p>
                        )}
                      </div>
                      <AlertDialog
                        open={deleteClassId === classItem.id}
                        onOpenChange={(open) => {
                          if (open) {
                            openDeleteClassDialog(classItem);
                          } else {
                            closeDeleteClassDialog();
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            onClick={() => openDeleteClassDialog(classItem)}
                            variant="ghost"
                            size="icon-sm"
                            className="text-gray-400 hover:text-red-600 transition-colors"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Eliminar classe?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              S'eliminara la classe{" "}
                              <strong>{classItem.name}</strong> amb tots els
                              seus alumnes.
                              <br />
                              <br />
                              Escriu el nom de la classe per confirmar
                              l'eliminació.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Nom de la classe
                            </label>
                            <input
                              type="text"
                              value={deleteClassNameInput}
                              onChange={(e) =>
                                setDeleteClassNameInput(e.target.value)
                              }
                              placeholder={classItem.name}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              autoFocus
                            />
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={!isDeleteClassNameValid(classItem.name)}
                              onClick={async () => {
                                await deleteClass(classItem.id);
                                closeDeleteClassDialog();
                              }}
                            >
                              Si, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          Alumnes ({classItem.students?.length || 0})
                        </h4>
                        <Button
                          onClick={() => {
                            setSelectedClassId(classItem.id);
                            setShowAddStudentModal(true);
                          }}
                          variant="brand"
                          size="sm"
                        >
                          + Afegir Alumne
                        </Button>
                      </div>

                      {classItem.students?.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          No hi ha alumnes en aquesta classe
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {classItem.students?.map((student) => {
                            const hasReport = studentReports[student.id];
                            const hasDraft = studentDrafts[student.id];
                            return (
                              <div
                                key={student.id}
                                className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {studentDisplayName(student) ||
                                        student.name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {student.gender && (
                                        <p className="text-xs text-gray-600">
                                          {genderLabel(student.gender)}
                                        </p>
                                      )}
                                      {student.age && (
                                        <p className="text-xs text-gray-600">
                                          {student.age} anys
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-gray-400 hover:text-red-600 transition-colors"
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
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Eliminar alumne?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          S'eliminara l'alumne{" "}
                                          <strong>
                                            {studentDisplayName(student) ||
                                              student.name}
                                          </strong>{" "}
                                          d'aquesta classe.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel·lar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          variant="destructive"
                                          onClick={() =>
                                            deleteStudent(
                                              classItem.id,
                                              student.id,
                                            )
                                          }
                                        >
                                          Si, eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                                <div className="flex gap-2">
                                  {hasReport ? (
                                    <Button
                                      onClick={() =>
                                        navigate(
                                          `/informe/${hasReport.id}?studentId=${student.id}&courseId=${courseId}`,
                                        )
                                      }
                                      variant="success"
                                      size="sm"
                                      className="flex-1 flex items-center justify-center gap-1"
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
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                      Veure Informe
                                    </Button>
                                  ) : hasDraft ? (
                                    <Button
                                      onClick={() =>
                                        navigate(
                                          `/crear-informe?studentId=${student.id}&studentName=${encodeURIComponent(studentDisplayName(student) || student.name)}&studentGender=${encodeURIComponent(student.gender || "no_indicat")}&courseId=${courseId}&courseName=${encodeURIComponent(course.level || course.name)}`,
                                        )
                                      }
                                      variant="warning"
                                      size="sm"
                                      className="flex-1 flex items-center justify-center gap-1"
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
                                      Seguir Editant
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={() =>
                                        navigate(
                                          `/crear-informe?studentId=${student.id}&studentName=${encodeURIComponent(studentDisplayName(student) || student.name)}&studentGender=${encodeURIComponent(student.gender || "no_indicat")}&courseId=${courseId}&courseName=${encodeURIComponent(course.level || course.name)}`,
                                        )
                                      }
                                      variant="brand"
                                      size="sm"
                                      className="flex-1 flex items-center justify-center gap-1"
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
                                          d="M12 4v16m8-8H4"
                                        />
                                      </svg>
                                      Crear Informe
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "collaborators" && (
          <div>
            <div className="mb-6">
              <Button
                onClick={() => setShowAddCollaboratorModal(true)}
                variant="success"
                size="lg"
                className="flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Afegir Col·laborador
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {course.collaborators?.length === 0 ? (
                <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hi ha col·laboradors encara
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Afegeix el primer col·laborador al curs
                  </p>
                </div>
              ) : (
                course.collaborators?.map((collab) => {
                  const isOwner = Boolean(collab.isOwner);
                  const isCurrentUser = user && collab.userId === user.id;

                  return (
                    <div
                      key={collab.id}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        {!isOwner &&
                          (isCurrentUser ? (
                            <Button
                              onClick={() => requestDeleteCollaborator(collab)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              Sortir del curs
                            </Button>
                          ) : (
                            <Button
                              onClick={() => requestDeleteCollaborator(collab)}
                              variant="ghost"
                              size="icon-sm"
                              className="text-gray-400 hover:text-red-600 transition-colors"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </Button>
                          ))}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {collab.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-indigo-600 font-medium">
                          {collab.role}
                        </p>
                        {isOwner && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                            title="Propietari del curs"
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Propietari
                          </span>
                        )}
                        {isCurrentUser && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            title="Aquest ets tu"
                          >
                            Tu
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{collab.email}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invitacions Pendents ({pendingInvitations.length})
                </h3>
                <Button
                  onClick={loadPendingInvitations}
                  variant="outline"
                  size="sm"
                  className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Actualitzar
                </Button>
              </div>

              {pendingInvitations.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No hi ha invitacions pendents en aquest curs
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {invitation.userName || "Usuari"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {invitation.userEmail}
                        </p>
                      </div>

                      {course.userId === user?.id && (
                        <Button
                          onClick={() =>
                            requestDeletePendingInvitation(invitation)
                          }
                          variant="destructive"
                          size="sm"
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <ExpandableActionButton
                onClick={openCreateCategoryModal}
                label="Afegir Categoria"
                variant="brand"
                size="lg"
                icon={
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                }
              />
              <ExpandableActionButton
                type="button"
                onClick={() => setShowImportItemsDialog(true)}
                label="Carregar Items"
                variant="outline"
                size="lg"
                icon={
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
                      d="M12 16V6m0 0l-4 4m4-4l4 4M4 18h16"
                    />
                  </svg>
                }
              />
              <ExpandableActionButton
                type="button"
                onClick={() => setShowExportItemsDialog(true)}
                label="Descarregar Items"
                variant="outline"
                size="lg"
                icon={
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
                      d="M12 8v10m0 0l-4-4m4 4l4-4M4 6h16"
                    />
                  </svg>
                }
              />
            </div>

            {/* Llista de categories */}
            {Object.keys(categories).length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hi ha categories encara
                </h3>
                <p className="text-gray-500 text-sm">
                  Crea la primera categoria per organitzar els teus items
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(categories).map(([key, category]) => {
                  const colorClasses = {
                    purple: "bg-purple-500",
                    blue: "bg-blue-500",
                    green: "bg-green-500",
                    orange: "bg-orange-500",
                    red: "bg-red-500",
                    pink: "bg-pink-500",
                    yellow: "bg-yellow-500",
                    teal: "bg-teal-500",
                    cyan: "bg-cyan-500",
                    indigo: "bg-indigo-500",
                    slate: "bg-slate-500",
                    emerald: "bg-emerald-500",
                  };
                  const colorClass =
                    colorClasses[category.color] || "bg-gray-400";

                  return (
                    <div
                      key={key}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                    >
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 ${colorClass} rounded-lg`}
                          ></div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {category.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Items: {category.items.length}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => openEditCategoryModal(key, category)}
                            variant="ghost"
                            size="icon-sm"
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Editar categoria"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button
                            onClick={() =>
                              requestDeleteCategory(key, category.name)
                            }
                            variant="ghost"
                            size="icon-sm"
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        {category.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm text-gray-700">
                              {item}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() =>
                                  openEditItemModal(key, index, item)
                                }
                                variant="ghost"
                                size="icon-xs"
                                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                title="Editar item"
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
                              </Button>
                              <Button
                                onClick={() =>
                                  requestRemoveItem(key, index, item)
                                }
                                variant="ghost"
                                size="icon-xs"
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Afegir nou item */}
                        <Button
                          onClick={() => openCreateItemModal(key)}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-300"
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Afegir item
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <ItemFormDialog
        open={showItemDialog}
        onOpenChange={(open) => {
          setShowItemDialog(open);
          if (!open) {
            setItemCategoryKey(null);
            setEditingItemIndex(null);
            setNewItemText("");
          }
        }}
        title={editingItemIndex !== null ? "Editar Item" : "Afegir Item"}
        description={
          editingItemIndex !== null
            ? "Modifica el text de l'item."
            : "Introdueix el text del nou item."
        }
        value={newItemText}
        onValueChange={setNewItemText}
        onSubmit={() => {
          if (!itemCategoryKey) return;

          if (editingItemIndex !== null) {
            updateItem(itemCategoryKey, editingItemIndex);
          } else {
            addItem(itemCategoryKey);
          }
        }}
        submitLabel={
          editingItemIndex !== null ? "Guardar canvis" : "Afegir item"
        }
      />

      <ImportItemsDialog
        open={showImportItemsDialog}
        onOpenChange={setShowImportItemsDialog}
        onImport={importItemsData}
        isImporting={isImportingItems}
      />

      <ExportItemsDialog
        open={showExportItemsDialog}
        onOpenChange={setShowExportItemsDialog}
        categoryCount={Object.keys(categories).length}
        itemCount={totalItemsCount}
        onExport={exportItemsCsv}
        isExporting={isExportingItems}
      />

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDialogAction}
            >
              {confirmDialog.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={showAddCollaboratorModal}
        onOpenChange={(open) => {
          setShowAddCollaboratorModal(open);
          if (!open) {
            setNewCollaborator({ email: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Invitació</DialogTitle>
            <DialogDescription>
              Introdueix el correu electrònic del col·laborador.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correu electrònic
            </label>
            <input
              type="email"
              value={newCollaborator.email}
              onChange={(e) =>
                setNewCollaborator({
                  ...newCollaborator,
                  email: e.target.value,
                })
              }
              onKeyDown={(e) => e.key === "Enter" && addCollaborator()}
              placeholder="Ex: profe@escola.cat"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              S'enviarà una invitació a aquest usuari perquè accepti el curs.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowAddCollaboratorModal(false);
                setNewCollaborator({ email: "" });
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel·lar
            </Button>
            <Button
              onClick={addCollaborator}
              disabled={!newCollaborator.email.trim()}
              variant="success"
              className="flex-1"
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CategoryFormDialog
        open={showNewCategory}
        onOpenChange={(open) => {
          setShowNewCategory(open);
          if (!open) {
            setEditingCategoryKey(null);
            setNewCategoryName("");
            setNewCategoryColor("purple");
          }
        }}
        title={
          editingCategoryKey ? "Editar Categoria" : "Afegir Nova Categoria"
        }
        description={
          editingCategoryKey
            ? "Modifica el nom i el color de la categoria."
            : "Defineix el nom i el color de la categoria."
        }
        name={newCategoryName}
        onNameChange={setNewCategoryName}
        color={newCategoryColor}
        onColorChange={setNewCategoryColor}
        availableColors={availableColors}
        onSubmit={editingCategoryKey ? updateCategory : createCategory}
        submitLabel={editingCategoryKey ? "Guardar canvis" : "Crear Categoria"}
      />

      <Dialog
        open={showAddClassModal}
        onOpenChange={(open) => {
          setShowAddClassModal(open);
          if (!open) {
            setNewClass({ name: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nova Classe</DialogTitle>
            <DialogDescription>
              Introdueix el nom de la classe.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la Classe
            </label>
            <input
              type="text"
              value={newClass.name}
              onChange={(e) =>
                setNewClass({ ...newClass, name: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && addClass()}
              placeholder="Ex: Grup A - Matins"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowAddClassModal(false);
                setNewClass({ name: "" });
              }}
              variant="outline"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel·lar
            </Button>
            <Button
              onClick={addClass}
              disabled={!newClass.name.trim()}
              variant="brand"
              className="flex-1"
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddStudentModal}
        onOpenChange={(open) => {
          setShowAddStudentModal(open);
          if (!open) {
            setNewStudent({
              name: "",
              lastName: "",
              gender: "no_indicat",
              age: "",
            });
            setSelectedClassId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Afegir Alumne</DialogTitle>
            <DialogDescription>
              Completa les dades de l'alumne.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'Alumne
              </label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && addStudent()}
                placeholder="Ex: Marc"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cognoms (només identificació)
              </label>
              <input
                type="text"
                value={newStudent.lastName}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, lastName: e.target.value })
                }
                placeholder="Ex: Serra Puig"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gènere
              </label>
              <select
                value={newStudent.gender}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, gender: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="no_indicat">No indicat</option>
                <option value="nen">Nen</option>
                <option value="nena">Nena</option>
                <option value="altre">Altre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Edat (opcional)
              </label>
              <input
                type="number"
                value={newStudent.age}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, age: e.target.value })
                }
                placeholder="Ex: 5"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <AlertTitle>Privacitat</AlertTitle>
              <AlertDescription>
                Els noms i dades dels alumnes mai es compartiran amb la IA.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowAddStudentModal(false);
                setNewStudent({
                  name: "",
                  lastName: "",
                  gender: "no_indicat",
                  age: "",
                });
                setSelectedClassId(null);
              }}
              variant="outline"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel·lar
            </Button>
            <Button
              onClick={addStudent}
              disabled={!newStudent.name.trim()}
              variant="brand"
              className="flex-1"
            >
              Afegir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CourseDetail;
