'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getDistributorSummary,
  getPeriods,
  getCommissionsByGeneration,
  getCommissionsByLevel,
  getCommissionHistory,
} from '@/lib/api';
import { formatCurrencyWithCode, formatNumber, formatPercentage } from '@/lib/utils';
import { CurrencyProvider } from '@/context/currency-context';
import { ArrowLeft, Users, DollarSign, TrendingUp, Layers, BarChart3, User, Grid3X3, Scale, Network, Activity, Calculator, GitBranch, Calendar, Package } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { GenerationsPanel } from '@/components/panels/generations-panel';
import { LevelsPanel } from '@/components/panels/levels-panel';
import { HistoryPanel } from '@/components/panels/history-panel';
import { LevelGenerationPanel } from '@/components/panels/level-generation-panel';
import { RollOverPanel } from '@/components/panels/rollover-panel';
import { NetworkPanel } from '@/components/panels/network-panel';
import { DiagnosticPanel } from '@/components/panels/diagnostic-panel';
import { SimulatorPanel } from '@/components/panels/simulator-panel';
import { VerticalGrowthPanel } from '@/components/panels/vertical-growth-panel';

export default function DistributorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const distributorId = parseInt(params.id as string, 10);
  const periodId = parseInt(searchParams.get('period') || '', 10);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: getPeriods,
  });

  const { data: summary, isLoading: loadingSummary, error: summaryError } = useQuery({
    queryKey: ['distributor-summary', distributorId, periodId],
    queryFn: () => getDistributorSummary(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  const { data: generations, isLoading: loadingGenerations } = useQuery({
    queryKey: ['commissions-generation', distributorId, periodId],
    queryFn: () => getCommissionsByGeneration(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  const { data: levels, isLoading: loadingLevels } = useQuery({
    queryKey: ['commissions-level', distributorId, periodId],
    queryFn: () => getCommissionsByLevel(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['commission-history', distributorId],
    queryFn: () => getCommissionHistory(distributorId, 36), // 3 años para comparación año a año
    enabled: !isNaN(distributorId),
  });

  const handlePeriodChange = (newPeriodId: string) => {
    router.push(`/dashboard/compensaciones/distributor/${distributorId}?period=${newPeriodId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isNaN(distributorId) || isNaN(periodId)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header showLogout />
        <main className="flex-1 container px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-red-500">ID de distribuidor o período inválido</p>
              <Button onClick={() => router.push('/dashboard/compensaciones')} className="mt-4">
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header showLogout />

      <main className="flex-1 container px-4 py-6">
        {/* Back Button & Period Selector */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard/compensaciones')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Período:</span>
            <Select value={periodId.toString()} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods?.map((period) => (
                  <SelectItem key={period.id_period} value={period.id_period.toString()}>
                    {period.name_period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loadingSummary && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        )}

        {/* Error State */}
        {summaryError && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-red-500">
                Error al cargar datos: {(summaryError as Error).message}
              </p>
              <Button onClick={() => router.push('/dashboard/compensaciones')} className="mt-4">
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {summary && (
          <CurrencyProvider currency={summary.currency}>
            {/* Distributor Header */}
            <Card className="mb-6">
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{summary.distributor.full_name}</h1>
                      <p className="text-gray-500">ID: {summary.distributor.id_customers}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {summary.distributor.date_registration && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Ingreso: {new Date(summary.distributor.date_registration).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {summary.distributor.kit_type && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            Kit: <span className="capitalize">{summary.distributor.kit_type}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {summary.distributor.name_plan}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-2">
                      Período: {summary.period.name_period}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {summary.currency.name} ({summary.currency.code})
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    Comisión Total
                    <InfoTooltip content="Suma total de comisiones ganadas en el período actual. Incluye comisiones de todas las generaciones (G0-G4) y niveles multinivel (ML1-ML3)." />
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-secondary">
                    {formatCurrencyWithCode(summary.commissions.total, summary.currency.code)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    Puntos Personales
                    <InfoTooltip content="Puntos generados por las compras personales del distribuidor en el período actual. Estos puntos califican para bonos personales y contribuyen al volumen de grupo." />
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(summary.personal.point_current_customers)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    Total en Red
                    <InfoTooltip content="Número total de distribuidores en toda la estructura de red debajo de ti, incluyendo todos los niveles de profundidad." />
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(summary.network.total_distributors)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Frontales calificados: {summary.network.qualified_frontals}
                    <InfoTooltip content="Frontales directos que cumplen con los requisitos mínimos de actividad (puntos personales y volumen de grupo)." />
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    Distribución G0-G2 / G3-G4
                    <InfoTooltip content="Proporción de comisiones entre generaciones cercanas (G0-G2, mayor porcentaje: 4-5%) y lejanas (G3-G4, menor porcentaje: 2%). Una mayor proporción en G0-G2 indica una red más saludable." />
                  </CardTitle>
                  <Layers className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-secondary"
                          style={{ width: `${summary.commissions.generation_summary.g0_g2_percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(summary.commissions.generation_summary.g0_g2_percentage)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    G0-G2: {formatCurrencyWithCode(summary.commissions.generation_summary.g0_g2_commission, summary.currency.code)} |
                    G3-G4: {formatCurrencyWithCode(summary.commissions.generation_summary.g3_g4_commission, summary.currency.code)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Panels */}
            <Tabs defaultValue="generations" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="generations" className="gap-2 flex-1 min-w-fit">
                  <Layers className="h-4 w-4" />
                  <span className="hidden sm:inline">Generaciones</span>
                  <span className="sm:hidden">Gen</span>
                </TabsTrigger>
                <TabsTrigger value="levels" className="gap-2 flex-1 min-w-fit">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Niveles</span>
                  <span className="sm:hidden">Niv</span>
                </TabsTrigger>
                <TabsTrigger value="matrix" className="gap-2 flex-1 min-w-fit">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Matriz</span>
                  <span className="sm:hidden">Mat</span>
                </TabsTrigger>
                <TabsTrigger value="rollover" className="gap-2 flex-1 min-w-fit">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Roll-Over</span>
                  <span className="sm:hidden">RO</span>
                </TabsTrigger>
                <TabsTrigger value="network" className="gap-2 flex-1 min-w-fit">
                  <Network className="h-4 w-4" />
                  <span>Red</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 flex-1 min-w-fit">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Histórico</span>
                  <span className="sm:hidden">Hist</span>
                </TabsTrigger>
                <TabsTrigger value="diagnostic" className="gap-2 flex-1 min-w-fit">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Diagnóstico</span>
                  <span className="sm:hidden">Diag</span>
                </TabsTrigger>
                <TabsTrigger value="simulator" className="gap-2 flex-1 min-w-fit">
                  <Calculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Simulador</span>
                  <span className="sm:hidden">Sim</span>
                </TabsTrigger>
                <TabsTrigger value="vertical-growth" className="gap-2 flex-1 min-w-fit">
                  <GitBranch className="h-4 w-4" />
                  <span className="hidden sm:inline">Crec. Vertical</span>
                  <span className="sm:hidden">Vert</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generations">
                <GenerationsPanel
                  generations={generations}
                  isLoading={loadingGenerations}
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="levels">
                <LevelsPanel
                  levels={levels}
                  isLoading={loadingLevels}
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="matrix">
                <LevelGenerationPanel
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="rollover">
                <RollOverPanel
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="network">
                <NetworkPanel
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="history">
                <HistoryPanel
                  history={history}
                  isLoading={loadingHistory}
                />
              </TabsContent>

              <TabsContent value="diagnostic">
                <DiagnosticPanel
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="simulator">
                <SimulatorPanel
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>

              <TabsContent value="vertical-growth">
                <VerticalGrowthPanel
                  distributorId={distributorId}
                  periodId={periodId}
                />
              </TabsContent>
            </Tabs>
          </CurrencyProvider>
        )}
      </main>

      <Footer />
    </div>
  );
}
