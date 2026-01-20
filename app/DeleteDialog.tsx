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
import { useProductStore } from "./useProductStore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react"; // Import useState for loading state

export function DeleteDialog() {
  const {
    openDialog,
    setOpenDialog,
    setSelectedProduct,
    selectedProduct,
    deleteProduct,
  } = useProductStore();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false); // Local loading state

  async function deleteProductFx() {
    if (selectedProduct) {
      setIsDeleting(true); // Start loading

      try {
        const result = await deleteProduct(selectedProduct.id);
        if (result.success) {
          // Show success toast
          toast({
            title: "¡Producto eliminado exitosamente!",
            description: `"€{selectedProduct.name}" ha sido eliminado permanentemente.`,
          });

          // Close dialog and clear selection
          setOpenDialog(false);
          setSelectedProduct(null);
        } else {
          // Show error toast
          toast({
            title: "Error al eliminar",
            description: "No se pudo eliminar el producto. Por favor, inténtalo de nuevo.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Show error toast
        toast({
          title: "Error al eliminar",
          description: "Ocurrió un error inesperado al eliminar el producto.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false); // Stop loading
      }
    }
  }

  return (
    <AlertDialog
      open={openDialog}
      onOpenChange={(open) => {
        setOpenDialog(open);
      }}
    >
      <AlertDialogContent className="p-4 sm:p-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg sm:text-xl">
            ¿Estás absolutamente seguro?
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-sm sm:text-base">
            Esta acción no se puede deshacer. Esto eliminará permanentemente el
            producto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 sm:mt-8 flex flex-col sm:flex-row gap-2 sm:gap-4">
          <AlertDialogCancel
            onClick={() => {
              setSelectedProduct(null);
            }}
            className="w-full sm:w-auto"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteProductFx()}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
