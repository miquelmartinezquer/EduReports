import React from "react";
import { Button } from "@/components/ui/button";

function AddItemButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      variant="success"
      size="sm"
      className="flex-1"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Afegir rubrica
    </Button>
  );
}

export default AddItemButton;
