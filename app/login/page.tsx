"use client";

import { useState } from "react";
import { useAuth } from "@/app/authContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loading from "@/components/Loading"; // Import Loading component
import { useToast } from "@/hooks/use-toast"; // Import toast hook

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Use toast hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Start loading

    try {
      await login(email, password);

      // Show success toast
      toast({
        title: "¡Inicio de sesión exitoso!",
        description: "¡Bienvenido de nuevo! Redirigiendo al panel...",
      });

      // Clear form
      setEmail("");
      setPassword("");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      // Show error toast
      toast({
        title: "Error de inicio de sesión",
        description: "Email o contraseña inválidos. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Stop loading
    }
  };



  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 space-y-4">
        <h2 className="text-2xl font-bold">Iniciar Sesión</h2>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          required
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
        <div className="text-center">
          <p>
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-blue-500">
              Registrarse
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
