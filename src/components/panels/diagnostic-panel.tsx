'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullDiagnostic, type FullDiagnostic } from '@/lib/api';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface DiagnosticPanelProps {
  distributorId: number;
  periodId: number;
}

const SEVERITY_CONFIG = {
  low: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  medium: {
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  high: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
  },
};

export function DiagnosticPanel({ distributorId, periodId }: DiagnosticPanelProps) {
  const { formatCurrency } = useCurrency();
  const { data, isLoading, error } = useQuery({
    queryKey: ['diagnostic-full', distributorId, periodId],
    queryFn: () => getFullDiagnostic(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  if (isLoading) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">Analizando datos...</p>
              <p className="text-sm text-gray-500 mt-1">
                Calculando distribuciones y comparando periodos
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Este proceso puede tomar varios segundos para redes grandes
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
          No se pudo cargar el diagnóstico. Verifica que el backend esté corriendo.
        </CardContent>
      </Card>
    );
  }

  const { dilution, comparison } = data;

  // Validar que los datos requeridos existan
  // Nota: severity puede ser null cuando has_problem es false (red saludable)
  // Nota: previous_period puede ser null si no hay período anterior disponible
  if (!dilution || !comparison || !comparison.changes || !comparison.current_period) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Datos de diagnóstico incompletos
        </CardContent>
      </Card>
    );
  }

  // Verificar si hay período anterior para comparación
  const hasPreviousPeriod = comparison.previous_period !== null;

  const severityConfig = SEVERITY_CONFIG[dilution.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low;
  const SeverityIcon = severityConfig.icon;

  const commissionTrend = (comparison.changes.commission_change ?? 0) >= 0;
  const networkTrend = (comparison.changes.network_change ?? 0) >= 0;
  const g0g2Trend = (comparison.changes.g0_g2_shift ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Diagnóstico Principal */}
      <Card className={`border-2 ${dilution.has_problem ? 'border-amber-300' : 'border-green-300'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${dilution.has_problem ? 'bg-amber-100' : 'bg-green-100'}`}>
                <SeverityIcon className={`h-6 w-6 ${severityConfig.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-xl">{dilution.title}</CardTitle>
                <CardDescription className="mt-1">{dilution.description}</CardDescription>
              </div>
            </div>
            <Badge className={severityConfig.color}>
              {dilution.severity === 'low' ? 'Bajo' : dilution.severity === 'medium' ? 'Moderado' : 'Alto'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Métricas de Impacto */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Impacto en Comisiones
                <InfoTooltip content="Cambio porcentual estimado en tus comisiones debido a la distribución actual de generaciones. Un valor negativo indica dilución de comisiones." />
              </p>
              <p className={`text-2xl font-bold ${dilution.impact.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dilution.impact.percentage >= 0 ? '+' : ''}{formatPercentage(dilution.impact.percentage)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 flex items-center">
                Distribución G3-G4
                <InfoTooltip content="Porcentaje de comisiones provenientes de generaciones lejanas (G3-G4 pagan solo 2%). Un valor alto indica mayor dilución." />
              </p>
              <p className="text-2xl font-bold text-amber-600">
                {formatPercentage(comparison.current_period.g3_g4_percentage)}
              </p>
            </div>
          </div>

          {/* Recomendaciones */}
          {dilution.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Recomendaciones</h4>
              </div>
              <ul className="space-y-1">
                {dilution.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparación de Períodos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {hasPreviousPeriod ? 'Comparación con Período Anterior' : 'Resumen del Período Actual'}
            <InfoTooltip content={hasPreviousPeriod ? "Compara los indicadores clave del período actual con el período anterior para identificar tendencias y cambios significativos." : "Muestra los indicadores clave del período actual. No hay datos de períodos anteriores para comparar."} />
          </CardTitle>
          <CardDescription>
            {hasPreviousPeriod
              ? `${comparison.previous_period!.name_period} → ${comparison.current_period.name_period}`
              : comparison.current_period.name_period
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Comisiones */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Comisiones</span>
                {hasPreviousPeriod && (commissionTrend ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ))}
              </div>
              <p className="text-xl font-bold">{formatCurrency(comparison.current_period.total_commission)}</p>
              {hasPreviousPeriod ? (
                <p className={`text-sm ${commissionTrend ? 'text-green-600' : 'text-red-600'}`}>
                  {commissionTrend ? '+' : ''}{formatCurrency(comparison.changes.commission_change)}
                  {' '}({commissionTrend ? '+' : ''}{formatPercentage(comparison.changes.commission_change_percentage)})
                </p>
              ) : (
                <p className="text-sm text-gray-400">Sin datos previos</p>
              )}
            </div>

            {/* Red */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Tamaño de Red</span>
                {hasPreviousPeriod && (networkTrend ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                ))}
              </div>
              <p className="text-xl font-bold">{formatNumber(comparison.current_period.network_size)}</p>
              {hasPreviousPeriod ? (
                <p className={`text-sm ${networkTrend ? 'text-green-600' : 'text-red-600'}`}>
                  {networkTrend ? '+' : ''}{formatNumber(comparison.changes.network_change)}
                  {' '}({networkTrend ? '+' : ''}{formatPercentage(comparison.changes.network_change_percentage)})
                </p>
              ) : (
                <p className="text-sm text-gray-400">Sin datos previos</p>
              )}
            </div>

            {/* G0-G2 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">G0-G2 (Cercanas)</span>
                {hasPreviousPeriod && (g0g2Trend ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ))}
              </div>
              <p className="text-xl font-bold">{formatPercentage(comparison.current_period.g0_g2_percentage)}</p>
              {hasPreviousPeriod ? (
                <p className={`text-sm ${g0g2Trend ? 'text-green-600' : 'text-red-600'}`}>
                  {g0g2Trend ? '+' : ''}{formatPercentage(comparison.changes.g0_g2_shift)} vs anterior
                </p>
              ) : (
                <p className="text-sm text-gray-400">Sin datos previos</p>
              )}
            </div>

            {/* Nuevos Plata+ */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Nuevos Plata+</span>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-bold">{formatNumber(comparison.changes.new_plata_plus_count)}</p>
              <p className="text-sm text-gray-500">en este período</p>
            </div>
          </div>

          {/* Barras de Distribución */}
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-gray-700">Distribución de Comisiones por Generación</h4>

            {/* Período Actual */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{comparison.current_period.name_period}</span>
                <span className="text-gray-500">
                  G0-G2: {formatPercentage(comparison.current_period.g0_g2_percentage)} |
                  G3-G4: {formatPercentage(comparison.current_period.g3_g4_percentage)}
                </span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${comparison.current_period.g0_g2_percentage}%` }}
                >
                  {comparison.current_period.g0_g2_percentage > 15 && 'G0-G2'}
                </div>
                <div
                  className="h-full bg-amber-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${comparison.current_period.g3_g4_percentage}%` }}
                >
                  {comparison.current_period.g3_g4_percentage > 15 && 'G3-G4'}
                </div>
              </div>
            </div>

            {/* Período Anterior - Solo mostrar si existe */}
            {hasPreviousPeriod && comparison.previous_period && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{comparison.previous_period.name_period}</span>
                  <span className="text-gray-500">
                    G0-G2: {formatPercentage(comparison.previous_period.g0_g2_percentage)} |
                    G3-G4: {formatPercentage(comparison.previous_period.g3_g4_percentage)}
                  </span>
                </div>
                <div className="h-6 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-300 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${comparison.previous_period.g0_g2_percentage}%` }}
                  >
                    {comparison.previous_period.g0_g2_percentage > 15 && 'G0-G2'}
                  </div>
                  <div
                    className="h-full bg-amber-300 flex items-center justify-center text-xs text-white font-medium"
                    style={{ width: `${comparison.previous_period.g3_g4_percentage}%` }}
                  >
                    {comparison.previous_period.g3_g4_percentage > 15 && 'G3-G4'}
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje cuando no hay período anterior */}
            {!hasPreviousPeriod && (
              <div className="text-sm text-gray-400 italic">
                No hay datos del período anterior para comparar.
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>G0-G2 (Mayor porcentaje: 4-5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded" />
              <span>G3-G4 (Menor porcentaje: 2%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
