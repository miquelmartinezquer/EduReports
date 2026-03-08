import { Toaster as Sonner, toast } from "sonner";

function Toaster(props) {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        className: "text-sm",
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
