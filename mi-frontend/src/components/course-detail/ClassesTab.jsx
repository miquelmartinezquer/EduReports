import { useEffect, useMemo, useState } from "react";
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

function ClassesTab({
  courseId,
  classItems,
  deleteClassId,
  deleteClassNameInput,
  onOpenAddClass,
  onOpenEditClass,
  onOpenDeleteClassDialog,
  onCloseDeleteClassDialog,
  onDeleteClassNameInputChange,
  isDeleteClassNameValid,
  onDeleteClass,
  onOpenAddStudent,
  studentReports,
  studentDrafts,
  studentDisplayName,
  genderLabel,
  onOpenEditStudentModal,
  onDeleteStudent,
  onOpenViewReport,
  onOpenCreateOrContinueReport,
}) {
  const openClassStorageKey = useMemo(
    () => `courseDetail.openClass.${courseId || "default"}`,
    [courseId],
  );
  const [openId, setOpenId] = useState(null);
  const [didLoadStoredOpenClass, setDidLoadStoredOpenClass] = useState(false);

  const isClassOpen = (id) =>
    openId !== null && openId !== undefined && String(openId) === String(id);

  useEffect(() => {
    try {
      const savedOpenClass = localStorage.getItem(openClassStorageKey);
      if (!savedOpenClass) {
        setOpenId(null);
        return;
      }

      if (!savedOpenClass.trim()) {
        setOpenId(null);
        return;
      }

      setOpenId(savedOpenClass);
    } catch (error) {
      console.warn(
        "No s'ha pogut llegir la classe oberta del localStorage",
        error,
      );
      setOpenId(null);
    } finally {
      setDidLoadStoredOpenClass(true);
    }
  }, [openClassStorageKey]);

  useEffect(() => {
    if (!didLoadStoredOpenClass) return;

    if (openId === null || openId === undefined) {
      try {
        localStorage.removeItem(openClassStorageKey);
      } catch (error) {
        console.warn(
          "No s'ha pogut netejar la classe oberta del localStorage",
          error,
        );
      }
      return;
    }

    try {
      localStorage.setItem(openClassStorageKey, String(openId));
    } catch (error) {
      console.warn(
        "No s'ha pogut guardar la classe oberta al localStorage",
        error,
      );
    }
  }, [didLoadStoredOpenClass, openClassStorageKey, openId]);

  useEffect(() => {
    if (openId === null || openId === undefined) return;
    if (!Array.isArray(classItems)) return;

    const stillExists = classItems.some(
      (classItem) => String(classItem.id) === String(openId),
    );

    if (!stillExists) {
      setOpenId(null);
    }
  }, [classItems, openId]);

  const toggleClass = (id) => {
    setOpenId((prev) => (String(prev) === String(id) ? null : id));
  };

  return (
    <div>
      <div className="mb-6">
        <Button
          onClick={onOpenAddClass}
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
        {classItems?.length === 0 ? (
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
          classItems?.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleClass(classItem.id)}
                className="w-full flex items-start justify-between p-6 hover:bg-gray-50 transition-colors text-left"
              >
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
                <div className="ml-4 flex items-center gap-1 shrink-0">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditClass(classItem);
                    }}
                    variant="ghost"
                    size="icon-sm"
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
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
                    open={deleteClassId === classItem.id}
                    onOpenChange={(open) => {
                      if (open) {
                        onOpenDeleteClassDialog(classItem);
                      } else {
                        onCloseDeleteClassDialog();
                      }
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDeleteClassDialog(classItem);
                        }}
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
                        <AlertDialogTitle>Eliminar classe?</AlertDialogTitle>
                        <AlertDialogDescription>
                          S'eliminara la classe{" "}
                          <strong>{classItem.name}</strong> amb tots els seus
                          alumnes.
                          <br />
                          <br />
                          Escriu el nom de la classe per confirmar l'eliminació.
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
                            onDeleteClassNameInputChange(e.target.value)
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
                            await onDeleteClass(classItem.id);
                            onCloseDeleteClassDialog();
                          }}
                        >
                          Si, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isClassOpen(classItem.id) ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isClassOpen(classItem.id) && (
                <div className="border-t px-6 pb-6 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Alumnes ({classItem.students?.length || 0})
                    </h4>
                    <Button
                      onClick={() => onOpenAddStudent(classItem.id)}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                  {studentDisplayName(student) || student.name}
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
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                  onClick={() =>
                                    onOpenEditStudentModal(
                                      classItem.id,
                                      student,
                                    )
                                  }
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
                                          onDeleteStudent(
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
                            </div>
                            <div className="flex gap-2">
                              {hasReport ? (
                                <Button
                                  onClick={() =>
                                    onOpenViewReport(hasReport.id, student.id)
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
                                    onOpenCreateOrContinueReport(student)
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
                                    onOpenCreateOrContinueReport(student)
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
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ClassesTab;
