import React from "react";
import { Button } from "@/components/ui/button";

function AddSectionButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="w-full h-12 border-2 border-dashed border-indigo-300 bg-indigo-50/40 text-indigo-700 font-semibold hover:bg-indigo-50 hover:border-indigo-400 transition-all"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Afegir nou apartat
    </Button>
  );
}

export default AddSectionButton;
