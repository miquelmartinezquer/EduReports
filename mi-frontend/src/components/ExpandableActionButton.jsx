import { Button } from "@/components/ui/button";

function ExpandableActionButton({
  label,
  icon,
  onClick,
  variant = "outline",
  size = "lg",
  className = "",
  type = "button",
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      variant={variant}
      size={size}
      className={`group flex items-center gap-2 overflow-hidden ${className}`}
      title={label}
      aria-label={label}
    >
      {icon}
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:opacity-100">
        {label}
      </span>
    </Button>
  );
}

export default ExpandableActionButton;
