"use client";

import { AnalyticsCard } from "@/components/ui/analytics-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/ui/chart-card";
import { ForecastingCard } from "@/components/ui/forecasting-card";
import { QRCodeComponent } from "@/components/ui/qr-code";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Download,
  Eye,
  Package,
  PieChart as PieChartIcon,
  QrCode,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../authContext";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import { useProductStore } from "../useProductStore";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function BusinessInsightsPage() {
  const { allProducts } = useProductStore();
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate analytics data with corrected calculations
  const analyticsData = useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        averagePrice: 0,
        totalQuantity: 0,
        categoryDistribution: [],
        statusDistribution: [],
        priceRangeDistribution: [],
        monthlyTrend: [],
        topProducts: [],
        lowStockProducts: [],
        stockUtilization: 0,
        valueDensity: 0,
        stockCoverage: 0,
      };
    }

    const totalProducts = allProducts.length;

    // CORRECTED: Total value calculation - sum of (price * quantity) for each product
    const totalValue = allProducts.reduce((sum, product) => {
      return sum + product.price * Number(product.quantity);
    }, 0);

    // CORRECTED: Low stock items - products with quantity > 0 AND quantity <= 20 (matching product table logic)
    const lowStockItems = allProducts.filter(
      (product) =>
        Number(product.quantity) > 0 && Number(product.quantity) <= 20
    ).length;

    // CORRECTED: Out of stock items - products with quantity = 0
    const outOfStockItems = allProducts.filter(
      (product) => Number(product.quantity) === 0
    ).length;

    // CORRECTED: Total quantity - sum of all quantities
    const totalQuantity = allProducts.reduce((sum, product) => {
      return sum + Number(product.quantity);
    }, 0);

    // CORRECTED: Average price calculation - total value divided by total quantity
    const averagePrice = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // CORRECTED: Stock utilization - percentage of products that are not out of stock
    const stockUtilization =
      totalProducts > 0
        ? ((totalProducts - outOfStockItems) / totalProducts) * 100
        : 0;

    // CORRECTED: Value density - total value divided by total products
    const valueDensity = totalProducts > 0 ? totalValue / totalProducts : 0;

    // CORRECTED: Stock coverage - average quantity per product
    const stockCoverage = totalProducts > 0 ? totalQuantity / totalProducts : 0;

    // Category distribution based on quantity (not just count)
    const categoryMap = new Map<
      string,
      { count: number; quantity: number; value: number }
    >();
    allProducts.forEach((product) => {
      const category = product.category || "Unknown";
      const current = categoryMap.get(category) || {
        count: 0,
        quantity: 0,
        value: 0,
      };
      categoryMap.set(category, {
        count: current.count + 1,
        quantity: current.quantity + Number(product.quantity),
        value: current.value + product.price * Number(product.quantity),
      });
    });

    // Convert to percentage based on quantity
    const categoryDistribution = Array.from(categoryMap.entries()).map(
      ([name, data]) => ({
        name,
        value: data.quantity,
        count: data.count,
        totalValue: data.value,
      })
    );

    // Status distribution
    const statusMap = new Map<string, number>();
    allProducts.forEach((product) => {
      const status = product.status || "Unknown";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const statusDistribution = Array.from(statusMap.entries()).map(
      ([name, value]) => ({ name, value })
    );

    // Price range distribution
    const priceRanges = [
      { name: "€0-€100", min: 0, max: 100 },
      { name: "€100-€500", min: 100, max: 500 },
      { name: "€500-€1000", min: 500, max: 1000 },
      { name: "€1000-€2000", min: 1000, max: 2000 },
      { name: "€2000+", min: 2000, max: Infinity },
    ];

    const priceRangeDistribution = priceRanges.map((range, index) => ({
      name: range.name,
      value: allProducts.filter((product) => {
        if (range.name === "€2000+") {
          // For €2000+ range, include products > €2000 (not including €2000)
          return product.price > 2000;
        } else if (range.name === "€1000-€2000") {
          // For €1000-€2000 range, include products >= €1000 and <= €2000
          return product.price >= range.min && product.price <= range.max;
        } else {
          // For other ranges, include products >= min and < max (exclusive upper bound)
          return product.price >= range.min && product.price < range.max;
        }
      }).length,
    }));

    // CORRECTED: Monthly trend based on actual product creation dates
    const monthlyTrend: Array<{
      month: string;
      products: number;
      monthlyAdded: number;
    }> = [];
    const months = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    // Group products by creation month using UTC to avoid timezone issues
    const productsByMonth = new Map<string, number>();
    allProducts.forEach((product) => {
      const date = new Date(product.createdAt);
      // Use UTC methods to ensure consistent month extraction
      const monthKey = `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1
      ).padStart(2, "0")}`;
      productsByMonth.set(monthKey, (productsByMonth.get(monthKey) || 0) + 1);
    });

    // Create trend data for the whole year
    // Use the year from the first product's creation date to ensure correct year mapping
    const dataYear =
      allProducts.length > 0
        ? new Date(allProducts[0].createdAt).getUTCFullYear()
        : new Date().getUTCFullYear();
    let cumulativeProducts = 0;

    months.forEach((month, index) => {
      const monthKey = `${dataYear}-${String(index + 1).padStart(2, "0")}`;
      const productsThisMonth = productsByMonth.get(monthKey) || 0;
      cumulativeProducts += productsThisMonth;

      monthlyTrend.push({
        month,
        products: cumulativeProducts,
        monthlyAdded: productsThisMonth,
      });
    });

    // Top products by value
    const topProducts = allProducts
      .sort(
        (a, b) => b.price * Number(b.quantity) - a.price * Number(a.quantity)
      )
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        value: product.price * Number(product.quantity),
        quantity: Number(product.quantity),
      }));

    // Low stock products (matching product table logic: quantity > 0 AND quantity <= 20)
    const lowStockProducts = allProducts
      .filter(
        (product) =>
          Number(product.quantity) > 0 && Number(product.quantity) <= 20
      )
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
      .slice(0, 5);

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      averagePrice,
      totalQuantity,
      stockUtilization,
      valueDensity,
      stockCoverage,
      categoryDistribution,
      statusDistribution,
      priceRangeDistribution,
      monthlyTrend,
      topProducts,
      lowStockProducts,
    };
  }, [allProducts]);

  const handleExportAnalytics = () => {
    toast({
      title: "Exportar Análisis",
      description: "¡La función de exportación de análisis estará disponible pronto!",
    });
  };

  if (!user) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">
              Por favor, inicia sesión para ver los análisis de negocio.
            </p>
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
            <h1 className="text-4xl font-bold text-primary">
              Análisis de Negocio
            </h1>
            <p className="text-lg text-muted-foreground">
              Información completa sobre el rendimiento de tu inventario
            </p>
          </div>
          <Button
            onClick={handleExportAnalytics}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Análisis
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsCard
            title="Total de Productos"
            value={analyticsData.totalProducts}
            icon={Package}
            iconColor="text-blue-600"
            description="Productos en inventario"
          />
          <AnalyticsCard
            title="Valor Total"
            value={`€${analyticsData.totalValue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-600"
            description="Valor total del inventario"
          />
          <AnalyticsCard
            title="Artículos con Stock Bajo"
            value={analyticsData.lowStockItems}
            icon={AlertTriangle}
            iconColor="text-orange-600"
            description="Artículos con cantidad <= 20"
          />
          <AnalyticsCard
            title="Sin Stock"
            value={analyticsData.outOfStockItems}
            icon={ShoppingCart}
            iconColor="text-red-600"
            description="Artículos con cantidad cero"
          />
        </div>

        {/* Charts and Insights */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="distribution">Distribución</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category Distribution */}
              <ChartCard title="Distribución por Categoría" icon={PieChartIcon}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.categoryDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Monthly Trend - Full Year */}
              <ChartCard
                title="Tendencia de Crecimiento de Productos (Año Completo)"
                icon={TrendingUp}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="products"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Status Distribution */}
              <ChartCard title="Distribución por Estado" icon={Activity}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Price Range Distribution */}
              <ChartCard title="Distribución por Rango de Precio" icon={BarChart3}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.priceRangeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Products by Value */}
              <ChartCard title="Productos Principales por Valor" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analyticsData.topProducts}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `€${value.toLocaleString()}`,
                        "Valor",
                      ]}
                      labelFormatter={(label) => `Producto: ${label}`}
                    />
                    <Bar dataKey="value" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Monthly Product Addition Trend */}
              <ChartCard title="Adición Mensual de Productos" icon={TrendingDown}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="monthlyAdded"
                      stroke="#FF8042"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {/* Low Stock Alerts */}
            <ChartCard title="Alertas de Stock Bajo" icon={AlertTriangle}>
              <div className="space-y-4">
                {analyticsData.lowStockProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analyticsData.lowStockProducts.map((product, index) => (
                      <Card
                        key={index}
                        className="border-orange-200 bg-orange-50 dark:bg-orange-950/20"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">
                                {product.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                SKU: {product.sku}
                              </p>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              {product.quantity} restantes
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      ¡No hay alertas de stock bajo en este momento!
                    </p>
                  </div>
                )}
              </div>
            </ChartCard>
          </TabsContent>
        </Tabs>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Información Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Precio Promedio</span>
                <span className="font-semibold">
                  ${analyticsData.averagePrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cantidad Total</span>
                <span className="font-semibold">
                  {analyticsData.totalQuantity.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Utilización de Stock</span>
                <span className="font-semibold">
                  {analyticsData.stockUtilization.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Salud del Inventario</span>
                <Badge
                  variant={
                    analyticsData.lowStockItems > 5 ? "destructive" : "default"
                  }
                >
                  {analyticsData.lowStockItems > 5
                    ? "Requiere Atención"
                    : "Saludable"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cobertura de Stock</span>
                <span className="font-semibold">
                  {analyticsData.stockCoverage.toFixed(1)} unidades prom.
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Densidad de Valor</span>
                <span className="font-semibold">
                  ${analyticsData.valueDensity.toFixed(2)} por producto
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Código QR Rápido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodeComponent
                data={`${window.location.origin}/business-insights`}
                title="QR del Panel"
                size={120}
                showDownload={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Forecasting Section */}
        <ForecastingCard products={allProducts} />
      </div>
    </AuthenticatedLayout>
  );
}
