'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getRollOverAnalysis, type RollOverAnalysis } from '@/lib/api';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { AlertTriangle, TrendingDown, Users, ArrowRight, Scale } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface RollOverPanelProps {
  distributorId: number;
  periodId: number;
}

export function RollOverPanel({ distributorId, periodId }: RollOverPanelProps) {
  const { formatCurrency } = useCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ['rollover-analysis', distributorId, periodId],
    queryFn: () => getRollOverAnalysis(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No hay datos de roll-over disponibles
        </CardContent>
      </Card>
    );
  }

  const { summary, legs } = data;
  const hasSignificantRollOver = summary.total_roll_over > 0;
  const legsWithRollover = legs.filter((leg) => leg.roll_over_applied);
  const rolloverConfig = summary.rollover_config;

  return (
    <div className="space-y-6">
      {/* Configuración de Roll-Over del Rango */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                {summary.distributor_rank}
              </Badge>
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Roll-Over:</strong> {rolloverConfig?.rollover_percent || 0}%
                </p>
                <p className="text-xs text-blue-600">
                  V. Grupal requerido: {formatNumber(rolloverConfig?.v_grupal_required || 0)} pts
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-800">
                <strong>Máximo por pierna:</strong>
              </p>
              <p className="text-xl font-bold text-blue-700">
                {formatNumber(rolloverConfig?.max_per_leg || 0)} pts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              Volumen de Grupo Total
              <InfoTooltip content="Suma de todos los puntos generados por tu red completa, antes de aplicar la regla de roll-over." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(summary.total_group_points)}</p>
            <p className="text-xs text-gray-500">puntos brutos</p>
          </CardContent>
        </Card>

        <Card className={summary.total_roll_over > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-600" />
              Roll-Over Aplicado
              <InfoTooltip content={`Puntos que se 'recortan' porque una pierna aporta más de ${formatNumber(rolloverConfig?.max_per_leg || 0)} pts (${rolloverConfig?.rollover_percent || 0}% del V. Grupal requerido).`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatNumber(summary.total_roll_over)}
            </p>
            <p className="text-xs text-gray-500">
              {formatPercentage(summary.roll_over_percentage)} del total
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Scale className="h-4 w-4 text-green-600" />
              Volumen Efectivo
              <InfoTooltip content="Volumen real que cuenta para tu calificación de rango después de aplicar el roll-over. Volumen Efectivo = Total - Roll-Over." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatNumber(summary.effective_group_points)}
            </p>
            <p className="text-xs text-gray-500">puntos para calificación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Frontales
              <InfoTooltip content="Número de frontales directos y cuántos de ellos tienen roll-over aplicado (su pierna excede el límite)." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total_frontals}</p>
            <p className="text-xs text-gray-500">
              {summary.frontals_with_rollover} con roll-over
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning if roll-over applied */}
      {hasSignificantRollOver && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">
                  Roll-Over aplicado en {summary.frontals_with_rollover} pierna(s)
                </p>
                <div className="text-sm text-amber-700 mt-1">
                  {legsWithRollover.length > 0 ? (
                    <>
                      <p>
                        Las siguientes piernas exceden el límite de{' '}
                        <strong>{formatNumber(rolloverConfig?.max_per_leg || 0)} pts</strong>:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {legsWithRollover.map((leg) => (
                          <li key={leg.id_customers}>
                            • <strong>{leg.full_name}</strong>: {formatNumber(leg.points)} pts
                            → Efectivo: {formatNumber(leg.effective_points)} pts
                            <span className="text-amber-600"> (Roll-over: -{formatNumber(leg.roll_over)})</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p>Considera balancear el crecimiento entre piernas para minimizar el roll-over.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legs Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Análisis por Pierna (Frontal)
            <InfoTooltip content={`Cada frontal directo representa una 'pierna'. Para tu rango (${summary.distributor_rank}), el máximo que puede aportar cada pierna es ${formatNumber(rolloverConfig?.max_per_leg || 0)} pts (${rolloverConfig?.rollover_percent || 0}% de ${formatNumber(rolloverConfig?.v_grupal_required || 0)} pts).`} />
          </CardTitle>
          <CardDescription>
            Desglose del volumen y roll-over por cada frontal directo.
            Límite por pierna: <strong>{formatNumber(rolloverConfig?.max_per_leg || 0)} pts</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Visual Bar Chart */}
          <div className="mb-6 space-y-3">
            {legs.map((leg) => (
              <div key={leg.id_customers} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[200px]" title={leg.full_name}>
                    {leg.full_name}
                  </span>
                  <span className="text-gray-500">
                    {formatNumber(leg.effective_points)} pts efectivos
                    {leg.exceeds_limit && (
                      <span className="text-amber-600 ml-1">(límite)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden flex">
                    {/* Effective portion */}
                    <div
                      className="h-full bg-green-500 flex items-center justify-end pr-1"
                      style={{ width: `${Math.min(leg.effective_percentage, 100)}%` }}
                    >
                      {leg.effective_percentage > 10 && (
                        <span className="text-xs text-white font-medium">
                          {formatPercentage(leg.effective_percentage)}
                        </span>
                      )}
                    </div>
                    {/* Roll-over portion */}
                    {leg.roll_over > 0 && (
                      <div
                        className="h-full bg-amber-400 flex items-center justify-center"
                        style={{
                          width: `${Math.min(
                            (leg.roll_over / summary.total_group_points) * 100,
                            100 - leg.effective_percentage
                          )}%`,
                        }}
                        title={`Roll-over: ${formatNumber(leg.roll_over)}`}
                      >
                        {leg.roll_over > summary.total_group_points * 0.05 && (
                          <span className="text-xs text-amber-900 font-medium">RO</span>
                        )}
                      </div>
                    )}
                  </div>
                  {leg.exceeds_limit && (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Excede límite
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Frontal</TableHead>
                <TableHead className="text-right">Puntos Brutos</TableHead>
                <TableHead className="text-right">Roll-Over</TableHead>
                <TableHead className="text-right">Pts Efectivos</TableHead>
                <TableHead className="text-right">% Efectivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {legs.map((leg) => (
                <TableRow
                  key={leg.id_customers}
                  className={leg.exceeds_limit ? 'bg-amber-50' : ''}
                >
                  <TableCell className="font-mono text-sm">{leg.id_customers}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {leg.full_name}
                      {leg.exceeds_limit && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                          Excede límite
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(leg.points)}</TableCell>
                  <TableCell className="text-right">
                    {leg.roll_over > 0 ? (
                      <span className="text-amber-600 font-medium">
                        {formatNumber(leg.roll_over)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(leg.effective_points)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(leg.effective_percentage)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals */}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">{formatNumber(summary.total_group_points)}</TableCell>
                <TableCell className="text-right text-amber-600">
                  {formatNumber(summary.total_roll_over)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatNumber(summary.effective_group_points)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Volumen efectivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-400 rounded" />
              <span>Roll-over (no cuenta para calificación)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
