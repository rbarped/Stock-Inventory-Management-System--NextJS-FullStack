"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AiFillProduct } from "react-icons/ai";
import { FiActivity, FiBarChart, FiFileText, FiHome } from "react-icons/fi"; // Import icons for new nav items
import { useAuth } from "../authContext";
import { ModeToggle } from "./ModeToggle";

export default function AppHeader() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();

      toast({
        title: "¡Cierre de sesión exitoso!",
        description: "Has cerrado sesión exitosamente.",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      toast({
        title: "Error al cerrar sesión",
        description: "No se pudo cerrar sesión. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="p-3 md:p-4 flex flex-col lg:flex-row justify-between items-center bg-primary text-primary-foreground rounded-lg shadow-md gap-3">
      {/* Logo and Welcome Section */}
      <div className="flex items-center gap-2 md:gap-4 w-full lg:w-auto">
        <div
          className={`flex aspect-square size-10 items-center justify-center rounded-lg bg-primary-dark text-primary-foreground cursor-pointer flex-shrink-0`}
          onClick={() => handleNavigation("/")}
        >
          <AiFillProduct className="text-2xl md:text-3xl" />
        </div>
        <div className="text-left overflow-hidden">
          <h1 className="text-lg md:text-2xl font-bold truncate">Bienvenido, {user?.name}!</h1>
          <p className="text-xs md:text-sm truncate">{user?.email}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center flex-wrap justify-center gap-2 w-full lg:w-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation("/")}
          className="text-primary-foreground hover:bg-primary-dark flex-shrink-0 text-xs md:text-sm px-2 md:px-4"
        >
          <FiHome className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Panel</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleNavigation("/business-insights")}
          className="text-primary-foreground hover:bg-primary-dark flex-shrink-0 text-xs md:text-sm px-2 md:px-4"
        >
          <FiBarChart className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Análisis</span>
        </Button>

        <ModeToggle />
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="h-8 md:h-10 px-3 md:px-6 bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:bg-secondary-dark transition-all flex-shrink-0 text-xs md:text-sm"
        >
          {isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}
        </Button>
      </div>
    </div>
  );
}
