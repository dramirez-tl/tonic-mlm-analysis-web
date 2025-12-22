'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  getVerticalGrowthAnalysis,
  type VerticalGrowthAnalysis,
  type DilutionChain,
  type PlataDistributor,
} from '@/lib/api';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import {
  AlertTriangle,
  TrendingDown,
  Award,
  ArrowRight,
  ChevronRight,
  Layers,
  Users,
  Activity,
  Loader2,
  Info,
  Scissors,
  Target,
  Lightbulb,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface VerticalGrowthPanelProps {
  distributorId: number;
  periodId: number;
}

// Colors for generations
const GENERATION_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  1: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  2: { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
  3: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  4: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const GENERATION_RATES: Record<number, string> = {
  0: '4%',
  1: '5%',
  2: '5%',
  3: '2%',
  4: '2%',
};

function HealthScoreGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 70) return 'text-green-600';
    if (s >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getLabel = (s: number) => {
    if (s >= 70) return 'Saludable';
    if (s >= 40) return 'Moderado';
    return 'Crítico';
  };

  const getDescription = (s: number) => {
    if (s >= 70) return 'Tu red tiene una buena distribución de generaciones con comisiones optimizadas.';
    if (s >= 40) return 'Tu red tiene dilución moderada. Considera desarrollar más frontales directos.';
    return 'Tu red tiene dilución severa. La mayoría de comisiones provienen de G3-G4 (solo 2%).';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <div className={`text-4xl font-bold ${getColor(score)}`}>{score}</div>
        <InfoTooltip
          content={
            <div className="space-y-2">
              <span className="font-medium block">Índice de Salud de Red</span>
              <span className="block">{getDescription(score)}</span>
              <div className="text-xs mt-2 pt-2 border-t border-gray-600 space-y-1">
                <span className="block"><strong>70-100:</strong> Saludable - Mayoría en G0-G2</span>
                <span className="block"><strong>40-69:</strong> Moderado - Balance mejorable</span>
                <span className="block"><strong>0-39:</strong> Crítico - Alta dilución</span>
              </div>
            </div>
          }
        />
      </div>
      <div className="text-sm text-gray-500">/ 100</div>
      <Badge className={`mt-1 ${score >= 70 ? 'bg-green-100 text-green-800' : score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
        {getLabel(score)}
      </Badge>
    </div>
  );
}

function DilutionChainDetail({ chain, onClose, formatCurrency }: { chain: DilutionChain; onClose: () => void; formatCurrency: (value: number) => string }) {
  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-amber-600" />
              Cadena de Dilución #{chain.chain_id}
            </SheetTitle>
            <SheetDescription>
              Detalle del impacto causado por {chain.plata_distributor.full_name}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Plata que causa el corte */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">{chain.plata_distributor.full_name}</p>
                <p className="text-sm text-amber-700">
                  {chain.plata_distributor.name_plan} • Nivel {chain.plata_distributor.nivel}
                </p>
              </div>
            </div>
            <p className="text-sm text-amber-700 mt-2">
              <strong>Este distribuidor crea un "corte" de generación.</strong> Todos los distribuidores
              debajo de él en la red pasan a una generación más alta (menos comisión para ti).
            </p>
          </div>

          {/* Explicación visual */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Por qué pasa esto?</p>
                <p>
                  Según el plan de compensación, cuando un distribuidor sube a <strong>Plata o superior</strong>
                  (id_plan ≥ 3), incrementa el contador de generaciones. Esto significa que distribuidores
                  que antes estaban en G2 (5%) ahora están en G3 (2%), perdiendo 3% de comisión por sus puntos.
                </p>
              </div>
            </div>
          </div>

          {/* Distribuidores afectados */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Distribuidores Afectados ({chain.affected_count})
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {chain.affected_distributors.map((dist, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{dist.full_name}</p>
                      <p className="text-xs text-gray-500">
                        {dist.name_plan} • Nivel {dist.nivel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">
                        -{formatCurrency(dist.commission_lost)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Badge className={`${GENERATION_COLORS[dist.generation_before]?.bg} ${GENERATION_COLORS[dist.generation_before]?.text}`}>
                      G{dist.generation_before} ({(dist.rate_before * 100).toFixed(0)}%)
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <Badge className={`${GENERATION_COLORS[dist.generation_after]?.bg} ${GENERATION_COLORS[dist.generation_after]?.text}`}>
                      G{dist.generation_after} ({(dist.rate_after * 100).toFixed(0)}%)
                    </Badge>
                    <span className="text-gray-500 ml-2">
                      {formatNumber(dist.points)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total perdido */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-red-800 font-medium">Total Comisión Perdida por esta Cadena</span>
              <span className="text-xl font-bold text-red-600">
                -{formatCurrency(chain.total_commission_lost)}
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function VerticalGrowthPanel({ distributorId, periodId }: VerticalGrowthPanelProps) {
  const { formatCurrency } = useCurrency();
  const [selectedChain, setSelectedChain] = useState<DilutionChain | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['vertical-growth', distributorId, periodId],
    queryFn: () => getVerticalGrowthAnalysis(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  if (isLoading) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">Analizando crecimiento vertical...</p>
              <p className="text-sm text-gray-500 mt-1">
                Identificando cadenas de dilución y puntos de corte
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No se pudo cargar el análisis de crecimiento vertical.
        </CardContent>
      </Card>
    );
  }

  const { summary, generation_distribution, dilution_chains, plata_plus_distributors, hypothetical_scenario } = data;

  return (
    <div className="space-y-6">
      {/* Header con Health Score */}
      <Card className={`border-2 ${summary.health_score >= 70 ? 'border-green-300' : summary.health_score >= 40 ? 'border-amber-300' : 'border-red-300'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${summary.health_score >= 70 ? 'bg-green-100' : summary.health_score >= 40 ? 'bg-amber-100' : 'bg-red-100'}`}>
                <Activity className={`h-6 w-6 ${summary.health_score >= 70 ? 'text-green-600' : summary.health_score >= 40 ? 'text-amber-600' : 'text-red-600'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">Diagnóstico de Crecimiento Vertical</CardTitle>
                <CardDescription className="mt-1">
                  Análisis detallado de cómo el crecimiento vertical afecta tus comisiones
                </CardDescription>
              </div>
            </div>
            <HealthScoreGauge score={summary.health_score} />
          </div>
        </CardHeader>
        <CardContent>
          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Plata+ en Red
                <InfoTooltip content="Número de distribuidores con rango Plata o superior en tu red. Cada uno crea un 'corte' de generación." />
              </p>
              <p className="text-2xl font-bold">{summary.total_plata_plus_in_network}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Dilución Estimada
                <InfoTooltip content="Comisión potencialmente perdida debido a los cortes de generación causados por distribuidores Plata+." />
              </p>
              <p className="text-2xl font-bold text-red-600">
                -{formatCurrency(summary.total_dilution_amount)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Profundidad de Red
                <InfoTooltip content="Número máximo de niveles de profundidad en tu red." />
              </p>
              <p className="text-2xl font-bold">{summary.network_depth} niveles</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Generación Promedio
                <InfoTooltip content="Generación promedio de los distribuidores en tu red. Menor es mejor (más comisión)." />
              </p>
              <p className="text-2xl font-bold">G{summary.average_generation.toFixed(1)}</p>
            </div>
          </div>

          {/* Card prominente: Comisión sin Plata+ */}
          <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-purple-100">
                  <Lightbulb className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    Comisión Total sin Distribuidores Plata+
                    <InfoTooltip content="Este escenario calcula cuánto ganarías si todos los distribuidores en tu red estuvieran en G0 (4%), es decir, sin que ningún Plata+ creara cortes de generación." />
                  </h3>
                  <p className="text-sm text-purple-700">{hypothetical_scenario.explanation}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border border-purple-200 text-center">
                  <p className="text-sm text-gray-500 mb-1">Comisión Actual</p>
                  <p className="text-2xl font-bold text-gray-800">{formatCurrency(hypothetical_scenario.current_commission)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border-2 border-purple-400 text-center shadow-sm">
                  <p className="text-sm text-purple-600 font-medium mb-1">Si no hubiera Platas+</p>
                  <p className="text-2xl font-bold text-purple-700">{formatCurrency(hypothetical_scenario.commission_if_no_platas)}</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${hypothetical_scenario.potential_gain >= 0 ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
                  <p className={`text-sm mb-1 ${hypothetical_scenario.potential_gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {hypothetical_scenario.potential_gain >= 0 ? 'Podrías ganar' : 'Diferencia'}
                  </p>
                  <p className={`text-2xl font-bold ${hypothetical_scenario.potential_gain >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {hypothetical_scenario.potential_gain >= 0 ? '+' : ''}{formatCurrency(hypothetical_scenario.potential_gain)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-purple-600 mt-4 text-center">
                * Este es un cálculo hipotético. Los Plata+ son parte natural del crecimiento de la red.
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Distribución por Generación - Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Distribución por Generación
            <InfoTooltip content="Muestra cómo se distribuyen tus comisiones entre las diferentes generaciones. G0-G2 pagan más (4-5%), G3-G4 pagan menos (2%)." />
          </CardTitle>
          <CardDescription>
            La generación determina el porcentaje de comisión. Cada Plata+ en el camino incrementa la generación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Visual bars */}
          <div className="space-y-4 mb-6">
            {generation_distribution.map((gen) => (
              <div key={gen.generation} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className={`${GENERATION_COLORS[gen.generation]?.bg} ${GENERATION_COLORS[gen.generation]?.text}`}>
                      G{gen.generation}
                    </Badge>
                    <span className="text-gray-600">{GENERATION_RATES[gen.generation]} comisión</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(gen.total_commission)}</span>
                    <span className="text-gray-500 ml-2">({formatPercentage(gen.percentage_of_total)})</span>
                  </div>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full ${gen.generation <= 2 ? 'bg-green-500' : 'bg-amber-500'} flex items-center justify-end pr-2 transition-all`}
                    style={{ width: `${Math.max(gen.percentage_of_total, 2)}%` }}
                  >
                    {gen.percentage_of_total > 10 && (
                      <span className="text-xs text-white font-medium">{gen.count} dist.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>G0-G2 (Mayor comisión: 4-5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded" />
              <span>G3-G4 (Menor comisión: 2%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cadenas de Dilución */}
      {dilution_chains.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Scissors className="h-5 w-5" />
              Cadenas de Dilución Detectadas
              <InfoTooltip content="Cada cadena representa un distribuidor Plata+ que causa que otros distribuidores pasen a generaciones más lejanas, reduciendo tu comisión." />
            </CardTitle>
            <CardDescription>
              Haz clic en una cadena para ver el detalle de los distribuidores afectados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dilution_chains.map((chain) => (
                <div
                  key={chain.chain_id}
                  className="p-4 border border-amber-200 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedChain(chain)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{chain.plata_distributor.full_name}</p>
                        <p className="text-sm text-gray-500">
                          {chain.plata_distributor.name_plan} • Nivel {chain.plata_distributor.nivel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{chain.affected_count} afectados</p>
                        <p className="font-bold text-red-600">-{formatCurrency(chain.total_commission_lost)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Plata+ Distributors */}
      {plata_plus_distributors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Distribuidores Plata+ en tu Red
              <InfoTooltip content="Lista de distribuidores con rango Plata o superior que crean cortes de generación. Ordenados por el impacto estimado en tus comisiones." />
            </CardTitle>
            <CardDescription>
              Distribuidores que al tener rango Plata+ crean &quot;cortes&quot; de generación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Rango</TableHead>
                  <TableHead className="text-center">Nivel</TableHead>
                  <TableHead className="text-center">Generación</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                  <TableHead className="text-right">En G3-G4 debajo</TableHead>
                  <TableHead className="text-right">Dilución Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plata_plus_distributors.map((dist) => (
                  <TableRow key={dist.id_customers} className={dist.estimated_dilution_caused > 0 ? 'bg-amber-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px] truncate" title={dist.full_name}>
                        {dist.full_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        {dist.name_plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{dist.nivel}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${GENERATION_COLORS[dist.generation]?.bg} ${GENERATION_COLORS[dist.generation]?.text}`}>
                        G{dist.generation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(dist.points)}</TableCell>
                    <TableCell className="text-right">
                      {dist.downline_in_g3_g4 > 0 ? (
                        <span className="text-amber-600 font-medium">{dist.downline_in_g3_g4}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {dist.estimated_dilution_caused > 0 ? (
                        <span className="text-red-600 font-medium">
                          -{formatCurrency(dist.estimated_dilution_caused)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Explicación educativa */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            ¿Por qué ocurre la dilución?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-900">El Problema del Crecimiento Vertical</h4>
              <p className="text-sm text-blue-800">
                Cuando tu red crece &quot;hacia abajo&quot; (verticalmente), los distribuidores pasan por más
                &quot;Platas&quot; en su camino hacia ti. Cada Plata+ incrementa el contador de generaciones.
              </p>
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs font-mono text-blue-700">
                  TÚ → [Plata A] → [Plata B] → [Distribuidor X]<br/>
                  Distribuidor X está en G2 (pasó por 2 Platas)<br/>
                  Comisión: 5% de sus puntos
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-900">El Impacto en Comisiones</h4>
              <p className="text-sm text-blue-800">
                La diferencia entre G2 (5%) y G3 (2%) es de 3 puntos porcentuales.
                Por cada $1,000 en puntos que pasan de G2 a G3, pierdes $30 en comisiones.
              </p>
              <div className="p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs font-mono text-blue-700">
                  G0: 4% | G1: 5% | G2: 5% | G3: 2% | G4: 2%<br/>
                  El &quot;salto&quot; de G2 a G3 es donde más se pierde<br/>
                  (5% → 2% = -3% por cada punto)
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Recomendaciones</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Desarrolla más frontales directos para tener más volumen en G0 (mayor comisión)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Apoya a tus distribuidores cercanos a crecer antes de que los más lejanos suban a Plata</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Monitorea quiénes están próximos a subir a Plata para anticipar cambios en tu estructura</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Detail sheet */}
      {selectedChain && (
        <DilutionChainDetail chain={selectedChain} onClose={() => setSelectedChain(null)} formatCurrency={formatCurrency} />
      )}
    </div>
  );
}
