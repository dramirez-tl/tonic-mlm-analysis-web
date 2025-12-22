'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  simulateNewFrontals,
  simulateVolumeIncrease,
  getPlataCandidates,
  simulateNewPlata,
  type SimulationScenario,
  type PlataCandidate,
} from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import {
  UserPlus,
  TrendingUp,
  Award,
  Play,
  ArrowUp,
  ArrowDown,
  Calculator,
  Users,
  Zap,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface SimulatorPanelProps {
  distributorId: number;
  periodId: number;
}

function SimulationResult({ simulation, formatCurrency }: { simulation: SimulationScenario | null; formatCurrency: (value: number) => string }) {
  if (!simulation) return null;

  const isPositive = simulation.impact.is_positive;

  return (
    <div className="mt-4 space-y-4">
      {/* Resultado Principal */}
      <div className={`p-4 rounded-lg border-2 ${isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-semibold ${isPositive ? 'text-green-800' : 'text-red-800'}`}>
            {simulation.impact.title}
          </h4>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <ArrowUp className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-600" />
            )}
            <span className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(simulation.impact.commission_change)}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-3">{simulation.description}</p>

        {/* Detalles */}
        <ul className="space-y-1">
          {simulation.impact.details.map((detail, index) => (
            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
              <span className="text-gray-400">•</span>
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* Desglose */}
      {(simulation.breakdown.positive_effects.length > 0 || simulation.breakdown.negative_effects.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {simulation.breakdown.positive_effects.length > 0 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <h5 className="text-sm font-medium text-green-800 mb-2">Efectos Positivos</h5>
              {simulation.breakdown.positive_effects.map((effect, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-green-700">{effect.description}</span>
                  <span className="font-medium text-green-800">+{formatCurrency(effect.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {simulation.breakdown.negative_effects.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h5 className="text-sm font-medium text-red-800 mb-2">Efectos Negativos</h5>
              {simulation.breakdown.negative_effects.map((effect, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-red-700">{effect.description}</span>
                  <span className="font-medium text-red-800">{formatCurrency(effect.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SimulatorPanel({ distributorId, periodId }: SimulatorPanelProps) {
  const { formatCurrency } = useCurrency();
  // State para simulaciones
  const [frontalsCount, setFrontalsCount] = useState(3);
  const [frontalsPoints, setFrontalsPoints] = useState(3300);
  const [volumePercentage, setVolumePercentage] = useState(10);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  // State para resultados
  const [frontalsResult, setFrontalsResult] = useState<SimulationScenario | null>(null);
  const [volumeResult, setVolumeResult] = useState<SimulationScenario | null>(null);
  const [plataResult, setPlataResult] = useState<SimulationScenario | null>(null);

  // State para loading
  const [loadingFrontals, setLoadingFrontals] = useState(false);
  const [loadingVolume, setLoadingVolume] = useState(false);
  const [loadingPlata, setLoadingPlata] = useState(false);

  // Obtener candidatos para Plata
  const { data: candidates, isLoading: loadingCandidates } = useQuery({
    queryKey: ['plata-candidates', distributorId, periodId],
    queryFn: () => getPlataCandidates(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  const runFrontalsSimulation = async () => {
    setLoadingFrontals(true);
    try {
      const result = await simulateNewFrontals(distributorId, periodId, frontalsCount, frontalsPoints);
      setFrontalsResult(result);
    } catch (error) {
      console.error('Error en simulación:', error);
    } finally {
      setLoadingFrontals(false);
    }
  };

  const runVolumeSimulation = async () => {
    setLoadingVolume(true);
    try {
      const result = await simulateVolumeIncrease(distributorId, periodId, volumePercentage);
      setVolumeResult(result);
    } catch (error) {
      console.error('Error en simulación:', error);
    } finally {
      setLoadingVolume(false);
    }
  };

  const runPlataSimulation = async (candidateId: number) => {
    setLoadingPlata(true);
    setSelectedCandidate(candidateId);
    try {
      const result = await simulateNewPlata(distributorId, periodId, candidateId);
      setPlataResult(result);
    } catch (error) {
      console.error('Error en simulación:', error);
    } finally {
      setLoadingPlata(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulador de Escenarios
            <InfoTooltip content="Herramienta para proyectar el impacto de diferentes acciones en tus comisiones. Las simulaciones usan datos actuales y reglas del plan de compensación para estimar resultados." />
          </CardTitle>
          <CardDescription>
            Explora diferentes escenarios y su impacto potencial en tus comisiones.
            Los resultados son estimaciones basadas en datos actuales.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="frontals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="frontals" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevos Frontales
          </TabsTrigger>
          <TabsTrigger value="volume" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Aumento Volumen
          </TabsTrigger>
          <TabsTrigger value="plata" className="gap-2">
            <Award className="h-4 w-4" />
            Subida a Plata
          </TabsTrigger>
        </TabsList>

        {/* Simulador de Nuevos Frontales */}
        <TabsContent value="frontals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Simular Nuevos Frontales Directos
                <InfoTooltip content="Simula el impacto de agregar nuevos distribuidores directos (frontales) con cierto volumen de puntos. Los nuevos frontales se colocan en G0 (4% de comisión)." />
              </CardTitle>
              <CardDescription>
                ¿Qué pasaría si agregas nuevos distribuidores directos a tu red?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Cantidad de Frontales
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={frontalsCount}
                    onChange={(e) => setFrontalsCount(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Puntos por Frontal
                  </label>
                  <Input
                    type="number"
                    min={1000}
                    max={50000}
                    step={100}
                    value={frontalsPoints}
                    onChange={(e) => setFrontalsPoints(parseInt(e.target.value) || 3300)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={runFrontalsSimulation}
                    disabled={loadingFrontals}
                    className="w-full gap-2"
                  >
                    {loadingFrontals ? (
                      <Skeleton className="h-4 w-4 rounded-full" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Simular
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800 mb-4">
                <Zap className="h-4 w-4 inline mr-1" />
                Los nuevos frontales se colocan en G0 (4% personal) y contribuyen directamente a tu volumen.
              </div>

              <SimulationResult simulation={frontalsResult} formatCurrency={formatCurrency} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulador de Aumento de Volumen */}
        <TabsContent value="volume">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Simular Aumento de Volumen
                <InfoTooltip content="Proyecta el impacto de un incremento uniforme en el volumen de toda tu red. Útil para estimar el efecto de campañas o promociones." />
              </CardTitle>
              <CardDescription>
                ¿Qué pasaría si toda tu red aumenta su volumen un cierto porcentaje?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Porcentaje de Aumento
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={volumePercentage}
                      onChange={(e) => setVolumePercentage(parseInt(e.target.value) || 10)}
                    />
                    <span className="flex items-center text-gray-500">%</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={runVolumeSimulation}
                    disabled={loadingVolume}
                    className="w-full gap-2"
                  >
                    {loadingVolume ? (
                      <Skeleton className="h-4 w-4 rounded-full" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Simular
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                {[5, 10, 20, 50].map((pct) => (
                  <Button
                    key={pct}
                    variant="outline"
                    size="sm"
                    onClick={() => setVolumePercentage(pct)}
                    className={volumePercentage === pct ? 'border-blue-500 bg-blue-50' : ''}
                  >
                    +{pct}%
                  </Button>
                ))}
              </div>

              <SimulationResult simulation={volumeResult} formatCurrency={formatCurrency} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulador de Subida a Plata */}
        <TabsContent value="plata">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Simular Subida a Plata
                <InfoTooltip content="Cuando un distribuidor sube a Plata, incrementa el contador de generaciones. Esto puede mover a distribuidores de G2 a G3 (de 5% a 2%), causando dilución de comisiones." />
              </CardTitle>
              <CardDescription>
                Analiza el impacto si un distribuidor de tu red sube a Plata.
                Esto puede causar que pase de una generación a otra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCandidates ? (
                <Skeleton className="h-32 w-full" />
              ) : candidates && candidates.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {candidates.map((candidate) => (
                      <div
                        key={candidate.id_customers}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedCandidate === candidate.id_customers
                            ? 'border-amber-500 bg-amber-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => runPlataSimulation(candidate.id_customers)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm truncate" title={candidate.full_name}>
                            {candidate.full_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {candidate.name_plan}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Nivel:</span>
                            <span className="font-medium">{candidate.nivel ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Generación:</span>
                            <span className="font-medium">G{candidate.generation ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-amber-600">
                            <span>Puntos:</span>
                            <span className="font-medium">{formatNumber(candidate.points)} pts</span>
                          </div>
                        </div>
                        {loadingPlata && selectedCandidate === candidate.id_customers && (
                          <div className="mt-2">
                            <Skeleton className="h-2 w-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <SimulationResult simulation={plataResult} formatCurrency={formatCurrency} />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No se encontraron candidatos cercanos a Plata en tu red.</p>
                  <p className="text-sm mt-1">
                    Los candidatos son distribuidores Bronce con buen volumen de puntos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
