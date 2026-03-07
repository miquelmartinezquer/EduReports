import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import fetchWithAuth from "./utils/fetchWithAuth";
import NavBar from "./components/NavBar";

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

  // Form states
  const [newCollaborator, setNewCollaborator] = useState({
    email: "",
  });
  const [newClass, setNewClass] = useState({ name: "" });
  const [newStudent, setNewStudent] = useState({ name: "", age: "" });

  // Category/Items states
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("purple");
  const [addingItemTo, setAddingItemTo] = useState(null);
  const [newItemText, setNewItemText] = useState("");

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
        alert("Invitació enviada correctament");
      }
    } catch (error) {
      console.error("Error enviant invitació:", error);
      alert(error.message || "No s'ha pogut enviar la invitació");
    }
  };

  const deleteCollaborator = async (collaboratorId) => {
    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/collaborators/${collaboratorId}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        setCourse((prev) => ({
          ...prev,
          collaborators: prev.collaborators.filter(
            (c) => c.id !== collaboratorId,
          ),
        }));
      }
    } catch (error) {
      console.error("Error eliminant col·laborador:", error);
      if (error.message.includes("creador")) {
        alert("No es pot eliminar el creador del curs");
      }
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const data = await fetchWithAuth(`/invitations/course/${courseId}/pending`);
      setPendingInvitations(
        Array.isArray(data?.invitations) ? data.invitations : [],
      );
    } catch (error) {
      console.error("Error carregant invitacions pendents:", error);
      setPendingInvitations([]);
    }
  };

  const deletePendingInvitation = async (invitationId) => {
    if (!window.confirm("Segur que vols eliminar aquesta invitació pendent?")) {
      return;
    }

    try {
      const data = await fetchWithAuth(`/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (data.success) {
        setPendingInvitations((prev) =>
          prev.filter((invitation) => invitation.id !== invitationId),
        );
      }
    } catch (error) {
      console.error("Error eliminant invitació pendent:", error);
      alert(error.message || "No s'ha pogut eliminar la invitació");
    }
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
        }
      } catch (error) {
        console.error("Error creant classe:", error);
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
      }
    } catch (error) {
      console.error("Error eliminant classe:", error);
    }
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
          setNewStudent({ name: "", age: "" });
          setShowAddStudentModal(false);
          setSelectedClassId(null);
        }
      } catch (error) {
        console.error("Error afegint alumne:", error);
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
      }
    } catch (error) {
      console.error("Error eliminant alumne:", error);
    }
  };

  // Categories i Items
  const loadAvailableColors = async () => {
    try {
      const data = await fetchWithAuth(`/courses/${courseId}/categories/colors`);
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
      alert("Introdueix el nom de la categoria");
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
      }
    } catch (error) {
      console.error("Error creant categoria:", error);
      alert("Error creant categoria");
    }
  };

  const deleteCategory = async (key) => {
    if (!window.confirm("Segur que vols eliminar aquesta categoria?")) return;

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${key}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        await loadCategories();
      }
    } catch (error) {
      console.error("Error eliminant categoria:", error);
    }
  };

  const addItem = async (categoryKey) => {
    if (!newItemText.trim()) {
      alert("Introdueix el text de l'item");
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
        setAddingItemTo(null);
        setNewItemText("");
      }
    } catch (error) {
      console.error("Error afegint item:", error);
    }
  };

  const removeItem = async (categoryKey, itemIndex) => {
    if (!window.confirm("Segur que vols eliminar aquest item?")) return;

    try {
      const data = await fetchWithAuth(
        `/courses/${courseId}/categories/${categoryKey}/items/${itemIndex}`,
        {
          method: "DELETE",
        },
      );
      if (data.success) {
        await loadCategories();
      }
    } catch (error) {
      console.error("Error eliminant item:", error);
    }
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

  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="mb-4 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ← Tornar als Cursos
          </button>
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
            <button
              onClick={() => setActiveTab("classes")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "classes"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Classes ({course.classes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("collaborators")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "collaborators"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Col·laboradors ({course.collaborators?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === "items"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Items ({Object.keys(categories).length || 0})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "classes" && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowAddClassModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors shadow-sm"
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
              </button>
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
                      <button
                        onClick={() => deleteClass(classItem.id)}
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
                      </button>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          Alumnes ({classItem.students?.length || 0})
                        </h4>
                        <button
                          onClick={() => {
                            setSelectedClassId(classItem.id);
                            setShowAddStudentModal(true);
                          }}
                          className="text-sm px-3 py-1 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200 transition-colors"
                        >
                          + Afegir Alumne
                        </button>
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
                                      {student.name}
                                    </p>
                                    {student.age && (
                                      <p className="text-xs text-gray-600">
                                        {student.age} anys
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() =>
                                      deleteStudent(classItem.id, student.id)
                                    }
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
                                  </button>
                                </div>
                                <div className="flex gap-2">
                                  {hasReport ? (
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/informe/${hasReport.id}?studentId=${student.id}&courseId=${courseId}`,
                                        )
                                      }
                                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
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
                                    </button>
                                  ) : hasDraft ? (
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/crear-informe?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&courseId=${courseId}&courseName=${encodeURIComponent(course.level || course.name)}`,
                                        )
                                      }
                                      className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-1"
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
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/crear-informe?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}&courseId=${courseId}&courseName=${encodeURIComponent(course.level || course.name)}`,
                                        )
                                      }
                                      className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
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
                                    </button>
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
              <button
                onClick={() => setShowAddCollaboratorModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold transition-colors shadow-sm"
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
              </button>
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
                course.collaborators?.map((collab) => (
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
                      {!collab.isOwner && (
                        <button
                          onClick={() => deleteCollaborator(collab.id)}
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
                        </button>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {collab.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-indigo-600 font-medium">
                        {collab.role}
                      </p>
                      {collab.isOwner && (
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
                      {user && collab.userId === user.id && (
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
                ))
              )}
            </div>

            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Invitacions Pendents ({pendingInvitations.length})
                </h3>
                <button
                  onClick={loadPendingInvitations}
                  className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Actualitzar
                </button>
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
                        <button
                          onClick={() => deletePendingInvitation(invitation.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Eliminar
                        </button>
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
            {/* Botó per afegir nova categoria */}
            {!showNewCategory && (
              <button
                onClick={() => setShowNewCategory(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-white"
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
                Afegir Nova Categoria
              </button>
            )}

            {/* Formulari nova categoria */}
            {showNewCategory && (
              <div className="p-4 mb-6 border border-indigo-200 rounded-lg bg-indigo-50 space-y-4">
                <h4 className="font-semibold text-gray-900">Nova Categoria</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && createCategory()}
                    placeholder="Ex: Motricitat i Moviment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
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
                      return (
                        <button
                          key={color.key}
                          onClick={() => setNewCategoryColor(color.key)}
                          className={`w-10 h-10 rounded-lg ${colorClasses[color.key] || "bg-gray-400"} ${
                            newCategoryColor === color.key
                              ? "ring-2 ring-offset-2 ring-indigo-500"
                              : ""
                          }`}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createCategory}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Crear Categoria
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategoryName("");
                      setNewCategoryColor("purple");
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel·lar
                  </button>
                </div>
              </div>
            )}

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
                        <button
                          onClick={() => deleteCategory(key)}
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
                        </button>
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
                            <button
                              onClick={() => removeItem(key, index)}
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
                            </button>
                          </div>
                        ))}

                        {/* Afegir nou item */}
                        {addingItemTo === key ? (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={newItemText}
                              onChange={(e) => setNewItemText(e.target.value)}
                              onKeyPress={(e) =>
                                e.key === "Enter" && addItem(key)
                              }
                              placeholder="Text del nou item..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => addItem(key)}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                            >
                              Afegir
                            </button>
                            <button
                              onClick={() => {
                                setAddingItemTo(null);
                                setNewItemText("");
                              }}
                              className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                            >
                              Cancel·lar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingItemTo(key)}
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
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Afegir Col·laborador */}
      {showAddCollaboratorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Enviar Invitació
            </h2>
            <div className="space-y-4 mb-6">
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
                  placeholder="Ex: profe@escola.cat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  S'enviarà una invitació a aquest usuari perquè accepti el curs.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddCollaboratorModal(false);
                  setNewCollaborator({
                    email: "",
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel·lar
              </button>
              <button
                onClick={addCollaborator}
                disabled={!newCollaborator.email.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Afegir Classe */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Crear Nova Classe
            </h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la Classe
              </label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) =>
                  setNewClass({ ...newClass, name: e.target.value })
                }
                onKeyPress={(e) => e.key === "Enter" && addClass()}
                placeholder="Ex: Grup A - Matins"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddClassModal(false);
                  setNewClass({ name: "" });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel·lar
              </button>
              <button
                onClick={addClass}
                disabled={!newClass.name.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Afegir Alumne */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Afegir Alumne
            </h2>
            <div className="space-y-4 mb-6">
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
                  placeholder="Ex: Marc Garcia"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
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
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setNewStudent({ name: "", age: "" });
                  setSelectedClassId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel·lar
              </button>
              <button
                onClick={addStudent}
                disabled={!newStudent.name.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Afegir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;
