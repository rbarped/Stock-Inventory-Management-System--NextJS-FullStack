"use client";

import { useState } from "react";
import { useAuth } from "@/app/authContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Import toast hook

export default function Logout() {
  const { logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Use toast hook
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Add loading state

  const handleLogout = async () => {
    setIsLoggingOut(true); // Start loading

    try {
      await logout();

      // Show success toast
      toast({
        title: "Logout Successful!",
        description: "You have been logged out successfully.",
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      // Show error toast
      toast({
        title: "Error al cerrar sesión",
        description: "Fallo al cerrar sesión. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false); // Stop loading
    }
  };

  return (
    <Button onClick={handleLogout} disabled={isLoggingOut} className="w-full">
      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
