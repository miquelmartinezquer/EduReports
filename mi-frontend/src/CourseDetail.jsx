import { useState, useEffect, useRef } from "react";
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
import CourseTabsNav from "./components/course-detail/CourseTabsNav";
import ClassesTab from "./components/course-detail/ClassesTab";
import CollaboratorsTab from "./components/course-detail/CollaboratorsTab";
import ItemsTab from "./components/course-detail/ItemsTab";
import TemplatesTab from "./components/course-detail/TemplatesTab";

const VALID_TABS = ["classes", "collaborators", "items", "templates"];

const getStoredTab = (storageKey) => {
  try {
    const savedTab = localStorage.getItem(storageKey);
    if (savedTab && VALID_TABS.includes(savedTab)) {
      return savedTab;
    }
  } catch (error) {
    console.warn(
      "No s'ha pogut llegir el tab actiu des de localStorage",
      error,
    );
  }

  return "classes";
};

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeTabStorageKey = `courseDetail.activeTab.${courseId || "default"}`;
  const skipNextTabPersistRef = useRef(true);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() =>
    getStoredTab(activeTabStorageKey),
  ); // 'classes', 'collaborators', 'items' o 'templates'
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
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [deleteClassId, setDeleteClassId] = useState(null);
  const [deleteClassNameInput, setDeleteClassNameInput] = useState("");

  // Form states
  const [newCollaborator, setNewCollaborator] = useState({
    email: "",
  });
  const [newClass, setNewClass] = useState({ name: "" });
  const [editingClass, setEditingClass] = useState({
    id: null,
    name: "",
    schedule: "",
  });
  const [newStudent, setNewStudent] = useState({
    name: "",
    lastName: "",
    gender: "no_indicat",
    age: "",
  });
  const [editingStudent, setEditingStudent] = useState({
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
    skipNextTabPersistRef.current = true;
    setActiveTab(getStoredTab(activeTabStorageKey));
  }, [activeTabStorageKey]);

  useEffect(() => {
    if (skipNextTabPersistRef.current) {
      skipNextTabPersistRef.current = false;
      return;
    }

    try {
      localStorage.setItem(activeTabStorageKey, activeTab);
    } catch (error) {
      console.warn("No s'ha pogut guardar el tab actiu a localStorage", error);
    }
  }, [activeTab, activeTabStorageKey]);

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

  const openEditClassModal = (classItem) => {
    if (!classItem?.id) return;
    setEditingClass({
      id: classItem.id,
      name: classItem.name || "",
      schedule: classItem.schedule || "",
    });
    setShowEditClassModal(true);
  };

  const updateClass = async () => {
    if (!editingClass.id || !editingClass.name.trim()) return;

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/classes/${editingClass.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingClass.name,
            schedule: editingClass.schedule || null,
          }),
        },
      );

      if (data.success) {
        setCourse((prev) => ({
          ...prev,
          classes: prev.classes.map((c) =>
            c.id === editingClass.id
              ? {
                  ...c,
                  ...data.class,
                  students: c.students,
                }
              : c,
          ),
        }));
        setShowEditClassModal(false);
        setEditingClass({ id: null, name: "", schedule: "" });
        toast.success("Classe actualitzada correctament");
      }
    } catch (error) {
      console.error("Error actualitzant classe:", error);
      toast.error("No s'ha pogut actualitzar la classe");
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

  const openEditStudentModal = (classId, student) => {
    setEditingClassId(classId);
    setEditingStudentId(student.id);
    setEditingStudent({
      name: student.name || "",
      lastName: student.lastName || "",
      gender: student.gender || "no_indicat",
      age: student.age ? String(student.age) : "",
    });
    setShowEditStudentModal(true);
  };

  const updateStudent = async () => {
    if (!editingClassId || !editingStudentId || !editingStudent.name.trim()) {
      return;
    }

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/classes/${editingClassId}/students/${editingStudentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingStudent.name,
            lastName: editingStudent.lastName || null,
            gender: editingStudent.gender || null,
            age: editingStudent.age ? parseInt(editingStudent.age, 10) : null,
          }),
        },
      );

      if (data.success) {
        setCourse((prev) => ({
          ...prev,
          classes: prev.classes.map((c) =>
            c.id === editingClassId
              ? {
                  ...c,
                  students: c.students.map((s) =>
                    s.id === editingStudentId ? data.student : s,
                  ),
                }
              : c,
          ),
        }));

        setShowEditStudentModal(false);
        setEditingClassId(null);
        setEditingStudentId(null);
        setEditingStudent({
          name: "",
          lastName: "",
          gender: "no_indicat",
          age: "",
        });
        toast.success("Alumne actualitzat correctament");
      }
    } catch (error) {
      console.error("Error actualitzant alumne:", error);
      toast.error("No s'ha pogut actualitzar l'alumne");
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

        <CourseTabsNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          course={course}
          totalItemsCount={totalItemsCount}
        />

        {/* Content */}
        {activeTab === "classes" && (
          <ClassesTab
            classItems={course.classes}
            deleteClassId={deleteClassId}
            deleteClassNameInput={deleteClassNameInput}
            onOpenAddClass={() => setShowAddClassModal(true)}
            onOpenEditClass={openEditClassModal}
            onOpenDeleteClassDialog={openDeleteClassDialog}
            onCloseDeleteClassDialog={closeDeleteClassDialog}
            onDeleteClassNameInputChange={setDeleteClassNameInput}
            isDeleteClassNameValid={isDeleteClassNameValid}
            onDeleteClass={deleteClass}
            onOpenAddStudent={(classId) => {
              setSelectedClassId(classId);
              setShowAddStudentModal(true);
            }}
            studentReports={studentReports}
            studentDrafts={studentDrafts}
            studentDisplayName={studentDisplayName}
            genderLabel={genderLabel}
            onOpenEditStudentModal={openEditStudentModal}
            onDeleteStudent={deleteStudent}
            onOpenViewReport={(reportId, studentId) =>
              navigate(
                `/informe/${reportId}?studentId=${studentId}&courseId=${courseId}`,
              )
            }
            onOpenCreateOrContinueReport={(student) =>
              navigate(
                `/crear-informe?studentId=${student.id}&studentName=${encodeURIComponent(studentDisplayName(student) || student.name)}&studentGender=${encodeURIComponent(student.gender || "no_indicat")}&courseId=${courseId}&courseName=${encodeURIComponent(course.level || course.name)}`,
              )
            }
          />
        )}

        {activeTab === "collaborators" && (
          <CollaboratorsTab
            course={course}
            user={user}
            pendingInvitations={pendingInvitations}
            onAddCollaborator={() => setShowAddCollaboratorModal(true)}
            onDeleteCollaborator={requestDeleteCollaborator}
            onRefreshInvitations={loadPendingInvitations}
            onDeletePendingInvitation={requestDeletePendingInvitation}
          />
        )}

        {activeTab === "items" && (
          <ItemsTab
            categories={categories}
            onOpenCreateCategoryModal={openCreateCategoryModal}
            onOpenImportItems={() => setShowImportItemsDialog(true)}
            onOpenExportItems={() => setShowExportItemsDialog(true)}
            onOpenEditCategoryModal={openEditCategoryModal}
            onRequestDeleteCategory={requestDeleteCategory}
            onOpenEditItemModal={openEditItemModal}
            onRequestRemoveItem={requestRemoveItem}
            onOpenCreateItemModal={openCreateItemModal}
          />
        )}

        {activeTab === "templates" && (
          <TemplatesTab courseId={courseId} courseName={course.name} />
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
        open={showEditClassModal}
        onOpenChange={(open) => {
          setShowEditClassModal(open);
          if (!open) {
            setEditingClass({ id: null, name: "", schedule: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Classe</DialogTitle>
            <DialogDescription>
              Modifica el nom i l'horari de la classe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la Classe
              </label>
              <input
                type="text"
                value={editingClass.name}
                onChange={(e) =>
                  setEditingClass({ ...editingClass, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && updateClass()}
                placeholder="Ex: Grup A - Matins"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horari (opcional)
              </label>
              <input
                type="text"
                value={editingClass.schedule}
                onChange={(e) =>
                  setEditingClass({
                    ...editingClass,
                    schedule: e.target.value,
                  })
                }
                onKeyDown={(e) => e.key === "Enter" && updateClass()}
                placeholder="Ex: Dilluns i dimecres 9:00-10:00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowEditClassModal(false);
                setEditingClass({ id: null, name: "", schedule: "" });
              }}
              variant="outline"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel·lar
            </Button>
            <Button
              onClick={updateClass}
              disabled={!editingClass.name.trim()}
              variant="brand"
              className="flex-1"
            >
              Guardar
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

      <Dialog
        open={showEditStudentModal}
        onOpenChange={(open) => {
          setShowEditStudentModal(open);
          if (!open) {
            setEditingClassId(null);
            setEditingStudentId(null);
            setEditingStudent({
              name: "",
              lastName: "",
              gender: "no_indicat",
              age: "",
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Alumne</DialogTitle>
            <DialogDescription>
              Modifica les dades de l'alumne.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'Alumne
              </label>
              <input
                type="text"
                value={editingStudent.name}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && updateStudent()}
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
                value={editingStudent.lastName}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    lastName: e.target.value,
                  })
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
                value={editingStudent.gender}
                onChange={(e) =>
                  setEditingStudent({
                    ...editingStudent,
                    gender: e.target.value,
                  })
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
                value={editingStudent.age}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, age: e.target.value })
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
                setShowEditStudentModal(false);
                setEditingClassId(null);
                setEditingStudentId(null);
                setEditingStudent({
                  name: "",
                  lastName: "",
                  gender: "no_indicat",
                  age: "",
                });
              }}
              variant="outline"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel·lar
            </Button>
            <Button
              onClick={updateStudent}
              disabled={!editingStudent.name.trim()}
              variant="brand"
              className="flex-1"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CourseDetail;
