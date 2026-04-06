import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TEMPLATE_HEADERS = [
  "TITOL_CATEGORIA",
  "TITOL_CATEGORIA2",
  "TITOL_CATEGORIA3",
];

const TEMPLATE_ROWS = [
  ["item1", "item2", "item3"],
  ["item4", "item5", "item6"],
];

const ALLOWED_EXTENSIONS = [".csv", ".xlsx"];

function ImportItemsDialog({ open, onOpenChange, onImport, isImporting }) {
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [pendingCategories, setPendingCategories] = useState([]);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  const readSheetRows = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error("El fitxer no conté cap full de dades");
    }

    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });
  };

  const parseRowsToCategories = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("El fitxer està buit");
    }

    const headerRow = rows[0] || [];
    const columns = headerRow
      .map((value, index) => ({
        name: String(value || "").trim(),
        index,
      }))
      .filter((column) => column.name.length > 0);

    if (columns.length === 0) {
      throw new Error("La primera fila ha de tenir noms de categoria");
    }

    const categories = columns.map((column) => {
      const items = [];

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex] || [];
        const cellValue = String(row[column.index] || "").trim();
        if (cellValue) {
          items.push(cellValue);
        }
      }

      return {
        name: column.name,
        items,
      };
    });

    const hasAtLeastOneItem = categories.some(
      (category) => category.items.length > 0,
    );

    if (!hasAtLeastOneItem) {
      throw new Error("No s'ha trobat cap rubrica per importar");
    }

    return categories;
  };

  const resetImportSelection = () => {
    setPendingCategories([]);
    setShowReplaceWarning(false);
    setSelectedFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isSupportedFileFormat = (fileName) => {
    const normalizedName = String(fileName || "")
      .toLowerCase()
      .trim();
    return ALLOWED_EXTENSIONS.some((extension) =>
      normalizedName.endsWith(extension),
    );
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isSupportedFileFormat(file.name)) {
      resetImportSelection();
      throw new Error(
        "Format de fitxer no vàlid. Només s'accepten fitxers .csv o .xlsx.",
      );
    }

    setSelectedFileName(file.name);

    const rows = await readSheetRows(file);
    const categories = parseRowsToCategories(rows);
    setPendingCategories(categories);
    setShowReplaceWarning(true);
  };

  const confirmImport = async () => {
    if (!pendingCategories.length) {
      return;
    }

    try {
      await onImport(pendingCategories);
      resetImportSelection();
    } catch (error) {
      // El component pare ja mostra el missatge d'error.
    }
  };

  const pendingItemsCount = pendingCategories.reduce(
    (total, category) => total + (category.items?.length || 0),
    0,
  );

  const handleDialogOpenChange = (nextOpen) => {
    if (!nextOpen) {
      resetImportSelection();
    }
    onOpenChange(nextOpen);
  };

  const downloadTemplate = () => {
    const rows = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS];
    const csv = `\uFEFF${rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n")}`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-importacio-rubriques.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] overflow-hidden p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>Importar Rubriques</DialogTitle>
            <DialogDescription>
              Prepara un fitxer de taula (com Excel o Google Sheets) amb les
              categories a la primera fila i les rubriques a les files següents.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(event) => {
                handleFileSelected(event).catch((error) => {
                  console.error("Error important fitxer:", error);
                  toast.error(
                    error.message || "No s'ha pogut importar el fitxer",
                  );
                });
              }}
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="brand"
                className="flex items-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
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
                    d="M12 16V6m0 0l-4 4m4-4l4 4M4 18h16"
                  />
                </svg>
                {isImporting ? "Important..." : "Penjar fitxer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={downloadTemplate}
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
                    d="M12 8v10m0 0l-4-4m4 4l4-4M4 6h16"
                  />
                </svg>
                Descarregar plantilla
              </Button>
            </div>

            {selectedFileName && (
              <p className="text-xs text-gray-600">
                Fitxer seleccionat: {selectedFileName}
              </p>
            )}

            <p className="text-sm text-gray-600">Plantilla de format:</p>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      {TEMPLATE_HEADERS.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2 text-left font-semibold border-b border-gray-200 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white text-gray-800">
                    {TEMPLATE_ROWS.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="odd:bg-white even:bg-gray-50"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${rowIndex}-${cellIndex}`}
                            className="px-3 py-2 border-b border-gray-100 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Només s'accepten fitxers amb format <code>.csv</code> o{" "}
              <code>.xlsx</code>.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showReplaceWarning}
        onOpenChange={(nextOpen) => {
          setShowReplaceWarning(nextOpen);
          if (!nextOpen && !isImporting) {
            resetImportSelection();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar importació?</AlertDialogTitle>
            <AlertDialogDescription>
              Si continues, es borraran totes les categories i totes les rubriques
              actuals del curs i se substituiran pel fitxer seleccionat.
              <br />
              <br />
              Fitxer: <strong>{selectedFileName || "(sense nom)"}</strong>
              <br />
              Dades detectades: <strong>{pendingCategories.length}</strong>{" "}
              categories i <strong>{pendingItemsCount}</strong> rubriques.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmImport}
              disabled={isImporting || !pendingCategories.length}
            >
              {isImporting ? "Important..." : "Sí, substituir i importar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ImportItemsDialog;
