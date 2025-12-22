'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type CommissionHistory } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { BarChart3, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, LineChart as LineChartIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';

interface HistoryPanelProps {
  history: CommissionHistory[] | undefined;
  isLoading: boolean;
}

// Nombres de meses en español para parsear
const MONTH_NAMES: Record<string, number> = {
  'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
  'JULIO': 7, 'AGOSTO': 8, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12,
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_LABELS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Colores por año - más vibrantes
const YEAR_COLORS: Record<number, { line: string; fill: string; text: string; bg: string }> = {
  2025: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)', text: 'text-blue-600', bg: 'bg-blue-500' },
  2024: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', text: 'text-emerald-600', bg: 'bg-emerald-500' },
  2023: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.1)', text: 'text-amber-600', bg: 'bg-amber-500' },
  2022: { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.1)', text: 'text-purple-600', bg: 'bg-purple-500' },
  2021: { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)', text: 'text-pink-600', bg: 'bg-pink-500' },
};

function getYearColor(year: number) {
  return YEAR_COLORS[year] || { line: '#6b7280', fill: 'rgba(107, 114, 128, 0.1)', text: 'text-gray-600', bg: 'bg-gray-500' };
}

// Parsear "OCTUBRE 2025" → { month: 10, year: 2025 }
function parseMonthYear(periodName: string): { month: number; year: number } | null {
  const normalized = periodName.toUpperCase().trim();

  for (const [monthName, monthNum] of Object.entries(MONTH_NAMES)) {
    if (normalized.includes(monthName)) {
      const yearMatch = normalized.match(/(\d{4})/);
      if (yearMatch) {
        return { month: monthNum, year: parseInt(yearMatch[1]) };
      }
    }
  }

  return null;
}

interface MonthData {
  month: number;
  monthLabel: string;
  years: Record<number, { total: number; subtotal: number; plan: string; periodId: number }>;
}

// Tipo para datos de Recharts
interface ChartDataPoint {
  month: string;
  monthNum: number;
  [key: string]: string | number;
}

export function HistoryPanel({ history, isLoading }: HistoryPanelProps) {
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'timeline' | 'comparison'>('comparison');
  const [compareYear, setCompareYear] = useState<number | null>(null);

  // Procesar datos para comparación año a año
  const { monthlyData, availableYears, sortedHistory, avgCommission, avgTotal } = useMemo(() => {
    if (!history || history.length === 0) {
      return { monthlyData: [], availableYears: [], sortedHistory: [], avgCommission: 0, avgTotal: 0 };
    }

    const sorted = [...history].sort((a, b) => a.id_period - b.id_period);

    const avg = sorted.length > 0
      ? sorted.reduce((acc, h) => acc + h.subtotal_earnings, 0) / sorted.length
      : 0;

    const avgT = sorted.length > 0
      ? sorted.reduce((acc, h) => acc + h.total, 0) / sorted.length
      : 0;

    // Agrupar por mes
    const monthMap = new Map<number, MonthData>();
    const yearsSet = new Set<number>();

    for (const h of sorted) {
      const parsed = parseMonthYear(h.name_period || '');
      if (!parsed) continue;

      yearsSet.add(parsed.year);

      if (!monthMap.has(parsed.month)) {
        monthMap.set(parsed.month, {
          month: parsed.month,
          monthLabel: MONTH_LABELS[parsed.month - 1],
          years: {},
        });
      }

      const monthData = monthMap.get(parsed.month)!;
      monthData.years[parsed.year] = {
        total: h.total,
        subtotal: h.subtotal_earnings,
        plan: h.name_plan || 'N/A',
        periodId: h.id_period,
      };
    }

    // Ordenar meses y años
    const months = Array.from(monthMap.values()).sort((a, b) => a.month - b.month);
    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return {
      monthlyData: months,
      availableYears: years,
      sortedHistory: sorted,
      avgCommission: avg,
      avgTotal: avgT,
    };
  }, [history]);

  // Año de comparación por defecto
  const effectiveCompareYear = compareYear || (availableYears.length > 1 ? availableYears[1] : null);

  // Datos formateados para Recharts
  const chartData = useMemo(() => {
    return monthlyData.map(md => {
      const point: ChartDataPoint = {
        month: MONTH_LABELS[md.month - 1],
        monthNum: md.month,
      };
      availableYears.forEach(year => {
        point[`year${year}`] = md.years[year]?.total || 0;
      });
      return point;
    });
  }, [monthlyData, availableYears]);

  // Calcular totales y diferencias por año
  const yearTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    availableYears.forEach(year => {
      totals[year] = monthlyData.reduce((acc, md) => acc + (md.years[year]?.total || 0), 0);
    });
    return totals;
  }, [monthlyData, availableYears]);

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

  const getTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const getPercentChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Histórico de Comisiones
          <InfoTooltip content="Registro de las comisiones ganadas en períodos anteriores. Permite analizar tendencias y patrones en el desempeño." />
        </CardTitle>
        <CardDescription>
          Evolución de comisiones y comparación año a año
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Comparación Anual
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Línea de Tiempo
            </TabsTrigger>
          </TabsList>

          {/* Comparison View */}
          <TabsContent value="comparison">
            <div className="space-y-6">
              {/* Year Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableYears.slice(0, 4).map((year, index) => {
                  const total = yearTotals[year] || 0;
                  const prevYear = availableYears[index + 1];
                  const prevTotal = prevYear ? (yearTotals[prevYear] || 0) : 0;
                  const diff = total - prevTotal;
                  const pctChange = getPercentChange(total, prevTotal);
                  const color = getYearColor(year);

                  return (
                    <Card key={year} className="relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1 h-full ${color.bg}`} />
                      <CardContent className="p-4 pl-5">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={`${color.bg} text-white`}>{year}</Badge>
                          {prevYear && (
                            <span className={`text-xs flex items-center gap-0.5 ${
                              diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : diff < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
                              {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className={`text-xl font-bold ${color.text}`}>{formatCurrency(total)}</p>
                        <p className="text-xs text-gray-500">Total acumulado</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {availableYears.map(year => (
                  <div key={year} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getYearColor(year).bg}`} />
                    <span className="text-sm font-medium">{year}</span>
                  </div>
                ))}
              </div>

              {/* Recharts Line Chart */}
              <Card>
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        tickFormatter={(value) => formatCurrency(value)}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        formatter={(value: number, name: string) => {
                          const year = parseInt(name.replace('year', ''));
                          return [formatCurrency(value), year.toString()];
                        }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                        filterNull={false}
                        itemSorter={(item) => {
                          // Solo mostrar líneas, no áreas (las líneas se renderizan después)
                          return -(item.dataKey?.toString().startsWith('year') ? parseInt(item.dataKey.toString().replace('year', '')) : 0);
                        }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload) return null;
                          // Filtrar duplicados - solo mostrar cada año una vez
                          const seen = new Set<string>();
                          const uniquePayload = payload.filter(entry => {
                            const key = entry.dataKey?.toString() || '';
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                          });
                          return (
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                              <p className="font-bold mb-2">{label}</p>
                              {uniquePayload.map((entry, index) => {
                                const year = parseInt((entry.dataKey?.toString() || '').replace('year', ''));
                                const color = getYearColor(year);
                                return (
                                  <div key={index} className="flex items-center gap-2 py-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.line }} />
                                    <span className="font-medium">{year}:</span>
                                    <span>{formatCurrency(Number(entry.value) || 0)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />
                      <Legend
                        formatter={(value: string) => {
                          const year = parseInt(value.replace('year', ''));
                          return year.toString();
                        }}
                        wrapperStyle={{ paddingTop: '10px' }}
                      />
                      {availableYears.map(year => (
                        <Area
                          key={`area-${year}`}
                          type="monotone"
                          dataKey={`year${year}`}
                          fill={getYearColor(year).fill}
                          stroke="none"
                          fillOpacity={0.3}
                          legendType="none"
                        />
                      ))}
                      {availableYears.map(year => (
                        <Line
                          key={`line-${year}`}
                          type="monotone"
                          dataKey={`year${year}`}
                          stroke={getYearColor(year).line}
                          strokeWidth={3}
                          dot={{ fill: getYearColor(year).line, strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                          connectNulls
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Comparison Selector & Table */}
              {availableYears.length >= 2 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base">Comparación Detallada</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Comparar {availableYears[0]} vs</span>
                        <Select
                          value={effectiveCompareYear?.toString() || ''}
                          onValueChange={(v) => setCompareYear(parseInt(v))}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableYears.slice(1).map(year => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mes</TableHead>
                            <TableHead className="text-right">
                              <span className={getYearColor(availableYears[0]).text}>{availableYears[0]}</span>
                            </TableHead>
                            <TableHead className="text-right">
                              <span className={getYearColor(effectiveCompareYear || 0).text}>{effectiveCompareYear}</span>
                            </TableHead>
                            <TableHead className="text-right">Diferencia</TableHead>
                            <TableHead className="text-right">Cambio %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyData.map(md => {
                            const current = md.years[availableYears[0]]?.total || 0;
                            const previous = effectiveCompareYear ? (md.years[effectiveCompareYear]?.total || 0) : 0;
                            const diff = current - previous;
                            const pctChange = getPercentChange(current, previous);
                            const hasBothValues = current > 0 || previous > 0;

                            return (
                              <TableRow
                                key={md.month}
                                className="hover:bg-gray-50"
                              >
                                <TableCell className="font-medium">{MONTH_LABELS_FULL[md.month - 1]}</TableCell>
                                <TableCell className="text-right">
                                  {current > 0 ? formatCurrency(current) : <span className="text-gray-300">-</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                  {previous > 0 ? formatCurrency(previous) : <span className="text-gray-300">-</span>}
                                </TableCell>
                                <TableCell className="text-right">
                                  {hasBothValues ? (
                                    <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}>
                                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {hasBothValues && previous > 0 ? (
                                    <div className={`flex items-center justify-end gap-1 ${
                                      pctChange > 0 ? 'text-green-600' : pctChange < 0 ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                      {pctChange > 0 && <ArrowUpRight className="h-3 w-3" />}
                                      {pctChange < 0 && <ArrowDownRight className="h-3 w-3" />}
                                      {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Total Row */}
                          <TableRow className="bg-gray-100 font-bold">
                            <TableCell>Total</TableCell>
                            <TableCell className={`text-right ${getYearColor(availableYears[0]).text}`}>
                              {formatCurrency(yearTotals[availableYears[0]] || 0)}
                            </TableCell>
                            <TableCell className={`text-right ${getYearColor(effectiveCompareYear || 0).text}`}>
                              {formatCurrency(yearTotals[effectiveCompareYear || 0] || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {(() => {
                                const diff = (yearTotals[availableYears[0]] || 0) - (yearTotals[effectiveCompareYear || 0] || 0);
                                return (
                                  <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}>
                                    {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              {(() => {
                                const current = yearTotals[availableYears[0]] || 0;
                                const prev = yearTotals[effectiveCompareYear || 0] || 0;
                                const pct = getPercentChange(current, prev);
                                return (
                                  <span className={pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-600' : ''}>
                                    {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Comisión Promedio</p>
                  <p className="text-xl font-bold">{formatCurrency(avgCommission)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Total Promedio</p>
                  <p className="text-xl font-bold">{formatCurrency(avgTotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Máxima Comisión</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(Math.max(...(sortedHistory.map(h => h.subtotal_earnings) || [0])))}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">Períodos</p>
                  <p className="text-xl font-bold">{sortedHistory.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Tendencia de Comisiones</p>
              <div className="flex items-end gap-1 h-40">
                {sortedHistory.map((h) => {
                  const maxCommission = Math.max(...sortedHistory.map(x => x.subtotal_earnings));
                  const height = maxCommission > 0 ? (h.subtotal_earnings / maxCommission) * 100 : 0;
                  const parsed = parseMonthYear(h.name_period || '');
                  const yearColor = parsed ? getYearColor(parsed.year) : getYearColor(0);

                  return (
                    <div
                      key={h.id_period}
                      className={`flex-1 ${yearColor.bg} rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group`}
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        {h.name_period}<br />
                        {formatCurrency(h.subtotal_earnings)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{sortedHistory[0]?.name_period}</span>
                <span>{sortedHistory[sortedHistory.length - 1]?.name_period}</span>
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((h, index) => {
                  const prevTotal = index > 0 ? sortedHistory[index - 1].total : h.total;
                  const totalChange = h.total - prevTotal;
                  const totalTrend = getTrend(h.total, prevTotal);

                  return (
                    <TableRow key={h.id_period}>
                      <TableCell className="font-medium">{h.name_period}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{h.name_plan || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(h.subtotal_earnings)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(h.total)}</TableCell>
                      <TableCell className="text-right">
                        {index > 0 && (
                          <div className={`flex items-center justify-end gap-1 ${
                            totalTrend === 'up' ? 'text-green-600' :
                            totalTrend === 'down' ? 'text-red-600' :
                            'text-gray-500'
                          }`}>
                            {totalTrend === 'up' && <TrendingUp className="h-4 w-4" />}
                            {totalTrend === 'down' && <TrendingDown className="h-4 w-4" />}
                            {totalTrend === 'neutral' && <Minus className="h-4 w-4" />}
                            <span>{totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
