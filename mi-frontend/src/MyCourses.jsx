import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { toast } from "@/components/ui/sonner";
import { API_BASE_URL } from "./config/api";

function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [sharedCourses, setSharedCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseLevel, setNewCourseLevel] = useState("I3");
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingCourseName, setEditingCourseName] = useState("");
  const [editingCourseLevel, setEditingCourseLevel] = useState("I3");
  const [deleteCourseId, setDeleteCourseId] = useState(null);
  const [deleteCourseNameInput, setDeleteCourseNameInput] = useState("");
  const [loading, setLoading] = useState(true);

  const openCourse = (courseId) => {
    navigate(`/cursos/${courseId}`);
  };

  const handleCourseCardKeyDown = (e, courseId) => {
    const target = e.target;
    const isInteractiveTarget =
      target instanceof HTMLElement &&
      (target.closest("input, textarea, select, button, [role='dialog']") ||
        target.isContentEditable);

    if (isInteractiveTarget) {
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCourse(courseId);
    }
  };

  useEffect(() => {
    loadCourses();

    const handleSharedCoursesUpdated = () => {
      loadCourses();
    };

    window.addEventListener(
      "shared-courses-updated",
      handleSharedCoursesUpdated,
    );

    return () => {
      window.removeEventListener(
        "shared-courses-updated",
        handleSharedCoursesUpdated,
      );
    };
  }, []);

  const mapCreateCourseError = (message) => {
    const normalized = (message || "").toLowerCase();

    if (normalized.includes("el nom del curs és requerit")) {
      return "El nom del curs és obligatori";
    }

    if (normalized.includes("el nivell del curs és requerit")) {
      return "El nivell del curs és obligatori";
    }

    if (normalized.includes("sql error")) {
      return "Hi ha hagut un error de base de dades en crear el curs";
    }

    return message || "No s'ha pogut crear el curs";
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const [myCoursesResponse, sharedCoursesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/courses`, {
          credentials: "include",
        }),
        fetch(`${API_BASE_URL}/courses/shared`, {
          credentials: "include",
        }),
      ]);

      const myCoursesData = await myCoursesResponse.json();
      const sharedCoursesData = await sharedCoursesResponse.json();

      // Assegurar que les dades siguin arrays
      if (Array.isArray(myCoursesData)) {
        setCourses(myCoursesData);
      } else {
        console.error(
          "Les dades rebudes de cursos propis no són un array:",
          myCoursesData,
        );
        setCourses([]);
      }

      if (Array.isArray(sharedCoursesData)) {
        setSharedCourses(sharedCoursesData);
      } else {
        console.error(
          "Les dades rebudes de cursos compartits no són un array:",
          sharedCoursesData,
        );
        setSharedCourses([]);
      }
    } catch (error) {
      console.error("Error carregant cursos:", error);
      setCourses([]);
      setSharedCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditCourseModal = (course) => {
    setEditingCourseId(course.id);
    setEditingCourseName(course.name || "");
    setEditingCourseLevel(course.level || "I3");
    setShowEditModal(true);
  };

  const updateCourse = async () => {
    if (!editingCourseId) {
      toast.error("No s'ha trobat el curs a editar");
      return;
    }

    if (!editingCourseName.trim()) {
      toast.error("Introdueix el nom del curs");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/courses/${editingCourseId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingCourseName,
            level: editingCourseLevel,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        toast.error(data.error || "No s'ha pogut actualitzar el curs");
        return;
      }

      setCourses((prev) =>
        prev.map((course) =>
          course.id === editingCourseId
            ? { ...course, ...data.course }
            : course,
        ),
      );

      setShowEditModal(false);
      setEditingCourseId(null);
      setEditingCourseName("");
      setEditingCourseLevel("I3");
      toast.success("Curs actualitzat correctament");
    } catch (error) {
      console.error("Error actualitzant curs:", error);
      toast.error("No s'ha pogut actualitzar el curs");
    }
  };

  const createCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error("Introdueix el nom del curs");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCourseName,
          level: newCourseLevel,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(mapCreateCourseError(data.error || data.message));
        return;
      }

      if (data.success) {
        setCourses([...courses, data.course]);
        setNewCourseName("");
        setNewCourseLevel("I3");
        setShowCreateModal(false);
        toast.success("Curs creat correctament");
      }
    } catch (error) {
      console.error("Error creant curs:", error);
      toast.error("No s'ha pogut crear el curs");
    }
  };

  const deleteCourse = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        toast.error(data.error || "No s'ha pogut eliminar el curs");
        return false;
      }

      setCourses(courses.filter((course) => course.id !== id));
      toast.success("Curs eliminat correctament");
      return true;
    } catch (error) {
      console.error("Error eliminant curs:", error);
      toast.error("No s'ha pogut eliminar el curs");
      return false;
    }
  };

  const openDeleteCourseDialog = (course) => {
    setDeleteCourseId(course.id);
    setDeleteCourseNameInput("");
  };

  const closeDeleteCourseDialog = () => {
    setDeleteCourseId(null);
    setDeleteCourseNameInput("");
  };

  const isDeleteCourseNameValid = (courseName) => {
    return (
      deleteCourseNameInput.trim().toLowerCase() ===
      (courseName || "").trim().toLowerCase()
    );
  };

  return (
    <>
      <NavBar />
      <div className="-mt-1 min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Els Meus Cursos
              </h1>
              <p className="text-gray-600">
                Gestiona els teus cursos i crea informes
              </p>
            </div>
          </div>

          {/* Botó crear curs */}
          <div className="mb-6">
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="success"
              size="lg"
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
              Crear Nou Curs
            </Button>
          </div>

          {/* Llista de cursos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading ? (
              <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
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
                <p className="text-gray-500 text-sm">Carregant cursos...</p>
              </div>
            ) : courses.length === 0 ? (
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tens cap curs encara
                </h3>
                <p className="text-gray-500 text-sm">
                  Crea el teu primer curs per començar
                </p>
              </div>
            ) : (
              courses.map((course) => (
                <article
                  key={course.id}
                  className="group bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2"
                  onClick={() => openCourse(course.id)}
                  onKeyDown={(e) => handleCourseCardKeyDown(e, course.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Obrir curs ${course.name}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center border border-emerald-200">
                      <svg
                        className="w-6 h-6 text-emerald-700"
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
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Curs propi
                      </span>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCourseModal(course);
                        }}
                        variant="ghost"
                        size="icon-sm"
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        aria-label={`Editar curs ${course.name}`}
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
                      <AlertDialog
                        open={deleteCourseId === course.id}
                        onOpenChange={(open) => {
                          if (open) {
                            openDeleteCourseDialog(course);
                          } else {
                            closeDeleteCourseDialog();
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteCourseDialog(course);
                            }}
                            variant="ghost"
                            size="icon-sm"
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            aria-label={`Eliminar curs ${course.name}`}
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

                        <AlertDialogContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar curs?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Aquesta accio eliminara el curs{" "}
                              <strong>{course.name}</strong> i no es pot desfer.
                              <br />
                              <br />
                              Escriu el nom del curs per confirmar l'eliminació.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Nom del curs
                            </label>
                            <input
                              type="text"
                              value={deleteCourseNameInput}
                              onChange={(e) =>
                                setDeleteCourseNameInput(e.target.value)
                              }
                              placeholder={course.name}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              autoFocus
                            />
                          </div>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={!isDeleteCourseNameValid(course.name)}
                              onClick={async () => {
                                const deleted = await deleteCourse(course.id);
                                if (deleted) {
                                  closeDeleteCourseDialog();
                                }
                              }}
                            >
                              Si, eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                    {course.name}
                  </h3>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Fes clic per entrar</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 group-hover:text-emerald-800">
                      Obrir curs
                      <svg
                        className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cursos compartits amb mi
            </h2>
            <p className="text-gray-600 mb-6">
              Cursos on tens accés com a col·laborador/a
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {loading ? (
                <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                  <p className="text-gray-500 text-sm">
                    Carregant cursos compartits...
                  </p>
                </div>
              ) : sharedCourses.length === 0 ? (
                <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tens cursos compartits
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Quan et comparteixin un curs, apareixerà aquí
                  </p>
                </div>
              ) : (
                sharedCourses.map((course) => (
                  <article
                    key={course.id}
                    className="group bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                    onClick={() => openCourse(course.id)}
                    onKeyDown={(e) => handleCourseCardKeyDown(e, course.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Obrir curs compartit ${course.name}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                        <svg
                          className="w-6 h-6 text-blue-700"
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
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Compartit
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-0.5">
                      {course.name}
                    </h3>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Fes clic per entrar</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700 group-hover:text-blue-800">
                        Obrir curs
                        <svg
                          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>

        <Dialog
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
            if (!open) {
              setNewCourseName("");
              setNewCourseLevel("I3");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nou Curs</DialogTitle>
              <DialogDescription>
                Introdueix les dades del nou curs.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom del Curs
              </label>
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createCourse()}
                placeholder="Ex: Matemàtiques I3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivell
              </label>
              <select
                value={newCourseLevel}
                onChange={(e) => setNewCourseLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Llar d'infants">Llar d'infants</option>
                <option value="I3">I3</option>
                <option value="I4">I4</option>
                <option value="I5">I5</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCourseName("");
                  setNewCourseLevel("I3");
                }}
                variant="outline"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel·lar
              </Button>
              <Button
                onClick={createCourse}
                disabled={!newCourseName.trim()}
                variant="success"
                className="flex-1"
              >
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open);
            if (!open) {
              setEditingCourseId(null);
              setEditingCourseName("");
              setEditingCourseLevel("I3");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Curs</DialogTitle>
              <DialogDescription>
                Actualitza les dades del curs.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom del Curs
              </label>
              <input
                type="text"
                value={editingCourseName}
                onChange={(e) => setEditingCourseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateCourse()}
                placeholder="Ex: Matemàtiques I3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivell
              </label>
              <select
                value={editingCourseLevel}
                onChange={(e) => setEditingCourseLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Llar d'infants">Llar d'infants</option>
                <option value="I3">I3</option>
                <option value="I4">I4</option>
                <option value="I5">I5</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCourseId(null);
                  setEditingCourseName("");
                  setEditingCourseLevel("I3");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel·lar
              </Button>
              <Button
                onClick={updateCourse}
                disabled={!editingCourseName.trim()}
                variant="brand"
                className="flex-1"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

export default MyCourses;
