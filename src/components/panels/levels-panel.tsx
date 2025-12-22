'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getCommissionDetails, type LevelBreakdown } from '@/lib/api';
import { formatNumber, formatPercentage } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { ChevronRight, Users } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface LevelsPanelProps {
  levels: LevelBreakdown[] | undefined;
  isLoading: boolean;
  distributorId: number;
  periodId: number;
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#3b82f6', // ML1 - blue
  2: '#8b5cf6', // ML2 - purple
  3: '#ec4899', // ML3 - pink
};

const LEVEL_PERCENTAGES: Record<number, string> = {
  1: '15-20%',
  2: '5%',
  3: '5%',
};

export function LevelsPanel({ levels, isLoading, distributorId, periodId }: LevelsPanelProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { formatCurrency } = useCurrency();

  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['commission-details-level', distributorId, periodId, selectedLevel],
    queryFn: () => getCommissionDetails(distributorId, periodId, {
      nivel: selectedLevel ?? undefined,
      limit: 10000, // Sin límite práctico - mostrar todos
    }),
    enabled: selectedLevel !== null && detailsOpen,
  });

  const handleLevelClick = (nivel: number) => {
    setSelectedLevel(nivel);
    setDetailsOpen(true);
  };

  const totalCommission = levels?.reduce((acc, l) => acc + l.comision, 0) || 0;
  const totalDistributors = levels?.reduce((acc, l) => acc + l.personas, 0) || 0;

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Comisiones por Nivel Multinivel
            <InfoTooltip content="Los niveles multinivel (ML1-ML3) miden la distancia directa en la línea de patrocinio. ML1: Frontales directos (15-20%). ML2: Patrocinados de tus frontales (5%). ML3: Tercer nivel (5%). A diferencia de las generaciones, aquí no importa el rango." />
          </CardTitle>
          <CardDescription>
            Desglose de comisiones según el nivel multinivel (ML1, ML2, ML3).
            ML1 son tus frontales directos, ML2 los frontales de tus frontales, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {levels?.map((level) => (
              <Card
                key={level.nivel}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleLevelClick(level.nivel)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      style={{ backgroundColor: LEVEL_COLORS[level.nivel] || '#6b7280' }}
                      className="text-white"
                    >
                      ML{level.nivel}
                    </Badge>
                    <span className="text-xs text-gray-500">{LEVEL_PERCENTAGES[level.nivel] || '-'}</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(level.comision)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(level.personas)} distribuidores</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nivel</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Distribuidores</TableHead>
                <TableHead className="text-right">Comisión Total</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels?.map((level) => {
                const percentOfTotal = totalCommission > 0
                  ? (level.comision / totalCommission) * 100
                  : 0;

                const descriptions: Record<number, string> = {
                  1: 'Frontales directos',
                  2: 'Segunda generación multinivel',
                  3: 'Tercera generación multinivel',
                };

                return (
                  <TableRow
                    key={level.nivel}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleLevelClick(level.nivel)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: LEVEL_COLORS[level.nivel] || '#6b7280' }}
                        />
                        <span className="font-medium">ML{level.nivel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {descriptions[level.nivel] || `Nivel ${level.nivel}`}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(level.personas)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(level.comision)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentOfTotal}%`,
                              backgroundColor: LEVEL_COLORS[level.nivel] || '#6b7280',
                            }}
                          />
                        </div>
                        <span className="text-sm">{formatPercentage(percentOfTotal)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Total Row */}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>Total</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{formatNumber(totalDistributors)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(totalCommission)}</span>
                    <span className="text-xs font-normal text-gray-500 flex items-center gap-1">
                      Comisión bruta
                      <InfoTooltip content="Esta es la comisión bruta (suma de todas las comisiones individuales). La comisión neta real puede ser menor debido a roll-over, retenciones u otras reglas del plan." />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: LEVEL_COLORS[selectedLevel ?? 1] }}
                />
                Detalle Nivel ML{selectedLevel}
              </SheetTitle>
              <SheetDescription>
                Distribuidores en el nivel multinivel {selectedLevel}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-6 py-4">
            {loadingDetails ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Generación</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details?.data.map((detail) => (
                    <TableRow key={detail.id_customers}>
                      <TableCell className="font-mono text-sm">{detail.id_customers}</TableCell>
                      <TableCell>{detail.full_name || 'Sin nombre'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{detail.name_plan || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">G{detail.generation}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(detail.point_business_customers)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(detail.subtotal_earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {details && details.pagination.has_more && (
              <p className="text-sm text-gray-500 mt-4 text-center pb-4">
                Mostrando {details.data.length} de {details.pagination.total} distribuidores
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
