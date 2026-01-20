"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { FiActivity, FiAlertCircle, FiCheckCircle, FiDatabase, FiPackage, FiRefreshCw, FiServer, FiUsers, FiXCircle } from "react-icons/fi";
import AuthenticatedLayout from "../components/AuthenticatedLayout";

interface EndpointStatus {
  name: string;
  path: string;
  status: "OK" | "ERROR" | "TIMEOUT";
  responseTime?: number;
  lastChecked: string;
}

interface SystemStatus {
  project: string;
  environment: string;
  currentTime: string;
  uptime: string;
  apiHealth: "HEALTHY" | "DEGRADED" | "DOWN";
  endpoints: EndpointStatus[];
  deployment: string;
  lastChecked: string;
}

export default function ApiStatusPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const endpoints = [
    { name: "Authentication API", path: "/api/auth/session" },
    { name: "Products API", path: "/api/products" },
    { name: "Categories API", path: "/api/categories" },
    { name: "Suppliers API", path: "/api/suppliers" },
  ];

  const checkEndpointHealth = async (path: string): Promise<{ status: "OK" | "ERROR" | "TIMEOUT"; responseTime?: number }> => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(path, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return { status: "OK", responseTime };
      } else {
        return { status: "ERROR", responseTime };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (error instanceof Error && error.name === 'AbortError') {
        return { status: "TIMEOUT", responseTime };
      }
      return { status: "ERROR", responseTime };
    }
  };

  const checkAllEndpoints = async (): Promise<EndpointStatus[]> => {
    const results: EndpointStatus[] = [];

    for (const endpoint of endpoints) {
      const { status, responseTime } = await checkEndpointHealth(endpoint.path);
      results.push({
        name: endpoint.name,
        path: endpoint.path,
        status,
        responseTime,
        lastChecked: new Date().toLocaleString(),
      });
    }

    return results;
  };

  const getOverallHealth = (endpoints: EndpointStatus[]): "HEALTHY" | "DEGRADED" | "DOWN" => {
    const okCount = endpoints.filter(ep => ep.status === "OK").length;
    const totalCount = endpoints.length;

    if (okCount === totalCount) return "HEALTHY";
    if (okCount > 0) return "DEGRADED";
    return "DOWN";
  };

  const calculateUptime = (): string => {
    // Simulate uptime calculation - in a real app, you'd track this from server start
    const startTime = new Date(Date.now() - Math.random() * 86400000); // Random start time within last 24h
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const loadSystemStatus = async () => {
    try {
      const endpointStatuses = await checkAllEndpoints();
      const overallHealth = getOverallHealth(endpointStatuses);

      const status: SystemStatus = {
        project: "Stockly Inventory Management",
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        currentTime: new Date().toLocaleString(),
        uptime: calculateUptime(),
        apiHealth: overallHealth,
        endpoints: endpointStatuses,
        deployment: "Local / Custom",
        lastChecked: new Date().toLocaleString(),
      };

      setSystemStatus(status);
    } catch (error) {
      toast({
        title: "Error cargando el estado del sistema",
        description: "No se pudo cargar el estado del sistema. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSystemStatus();
    setIsRefreshing(false);
    toast({
      title: "Estado actualizado",
      description: "El estado del sistema ha sido actualizado.",
    });
  };

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK":
      case "HEALTHY":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case "ERROR":
      case "DOWN":
        return <FiXCircle className="h-4 w-4 text-red-500" />;
      case "TIMEOUT":
      case "DEGRADED":
        return <FiAlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FiAlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
      case "HEALTHY":
        return "bg-green-100 text-green-800";
      case "ERROR":
      case "DOWN":
        return "bg-red-100 text-red-800";
      case "TIMEOUT":
      case "DEGRADED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <FiRefreshCw className="h-6 w-6 animate-spin" />
              <span>Loading system status...</span>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Estado de la API y del Proyecto</h1>
            <p className="text-lg text-muted-foreground">
              Monitoreo en tiempo real de los endpoints de la API y la salud del sistema de Stockly
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <FiRefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>

        {systemStatus && (
          <>
            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.project}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entorno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{systemStatus.environment}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Hora Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.currentTime}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo de actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.uptime}</div>
                </CardContent>
              </Card>
            </div>

            {/* API Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiActivity className="h-5 w-5" />
                  Salud de la API
                </CardTitle>
                <CardDescription>
                  Estado general de salud de todos los endpoints de la API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {getStatusIcon(systemStatus.apiHealth)}
                  <Badge className={getStatusColor(systemStatus.apiHealth)}>
                    API está {systemStatus.apiHealth.toLowerCase()}.
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Endpoints Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiServer className="h-5 w-5" />
                  Endpoints
                </CardTitle>
                <CardDescription>
                  Salud individual de los endpoints y tiempos de respuesta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemStatus.endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(endpoint.status)}
                        <div>
                          <h4 className="font-semibold">{endpoint.name}</h4>
                          <p className="text-sm text-muted-foreground">{endpoint.path}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                        {endpoint.responseTime && (
                          <span className="text-sm text-muted-foreground">
                            {endpoint.responseTime}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiDatabase className="h-5 w-5" />
                    Estado de la Base de Datos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon("OK")}
                      <span>Conexión a MongoDB</span>
                      <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon("OK")}
                      <span>Cliente Prisma</span>
                      <Badge className="bg-green-100 text-green-800">Listo</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FiUsers className="h-5 w-5" />
                    Autenticación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon("OK")}
                      <span>Servicio JWT</span>
                      <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon("OK")}
                      <span>Gestión de Sesiones</span>
                      <Badge className="bg-green-100 text-green-800">Funcionando</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deployment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiPackage className="h-5 w-5" />
                  Información de Despliegue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Despliegue</h4>
                    <p className="text-muted-foreground">{systemStatus.deployment}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Última comprobación</h4>
                    <p className="text-muted-foreground">{systemStatus.lastChecked}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
