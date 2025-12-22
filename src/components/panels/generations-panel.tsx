'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { getCommissionDetails, type GenerationBreakdown, type CommissionDetail } from '@/lib/api';
import { formatNumber, formatPercentage, GENERATION_COLORS, GENERATION_NAMES } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { ChevronRight, Layers, Users, DollarSign } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface GenerationsPanelProps {
  generations: GenerationBreakdown[] | undefined;
  isLoading: boolean;
  distributorId: number;
  periodId: number;
}

export function GenerationsPanel({ generations, isLoading, distributorId, periodId }: GenerationsPanelProps) {
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { formatCurrency } = useCurrency();

  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['commission-details', distributorId, periodId, selectedGeneration],
    queryFn: () => getCommissionDetails(distributorId, periodId, {
      generation: selectedGeneration ?? undefined,
      limit: 10000, // Sin límite práctico - mostrar todos
    }),
    enabled: selectedGeneration !== null && detailsOpen,
  });

  const handleGenerationClick = (generation: number) => {
    setSelectedGeneration(generation);
    setDetailsOpen(true);
  };

  const totalCommission = generations?.reduce((acc, g) => acc + g.comision, 0) || 0;
  const totalDistributors = generations?.reduce((acc, g) => acc + g.personas, 0) || 0;

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
            <Layers className="h-5 w-5" />
            Comisiones por Generación
            <InfoTooltip content="Las generaciones (G0-G4) clasifican a los distribuidores según cuántos Platas hay entre tú y ellos. G0: Sin Platas intermedios (4%). G1: 1 Plata (5%). G2: 2 Platas (5%). G3: 3 Platas (2%). G4: 4 Platas (2%)." />
          </CardTitle>
          <CardDescription>
            Desglose de comisiones según la generación (G0-G4) de cada distribuidor en tu red.
            Haz clic en una generación para ver el detalle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {generations?.map((gen) => (
              <Card
                key={gen.generation}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleGenerationClick(gen.generation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      style={{ backgroundColor: GENERATION_COLORS[gen.generation] }}
                      className="text-white"
                    >
                      G{gen.generation}
                    </Badge>
                    <span className="text-xs text-gray-500">{gen.porcentaje}%</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(gen.comision)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(gen.personas)} distribuidores</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="flex items-center">
                  Generación
                  <InfoTooltip content="Clasificación basada en Platas intermedios. G0=4%, G1=5%, G2=5%, G3=2%, G4=2% de comisión sobre puntos." />
                </TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end">
                    Porcentaje
                    <InfoTooltip content="Porcentaje de comisión que se paga sobre los puntos de los distribuidores en esta generación." />
                  </span>
                </TableHead>
                <TableHead className="text-right">Distribuidores</TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end">
                    Comisión Total
                    <InfoTooltip content="Suma de todas las comisiones generadas por distribuidores en esta generación." />
                  </span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end">
                    % del Total
                    <InfoTooltip content="Qué porcentaje de tus comisiones totales proviene de esta generación." />
                  </span>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generations?.map((gen) => {
                const percentOfTotal = totalCommission > 0
                  ? (gen.comision / totalCommission) * 100
                  : 0;

                return (
                  <TableRow
                    key={gen.generation}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleGenerationClick(gen.generation)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: GENERATION_COLORS[gen.generation] }}
                        />
                        <span className="font-medium">{GENERATION_NAMES[gen.generation]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{gen.porcentaje}%</TableCell>
                    <TableCell className="text-right">{formatNumber(gen.personas)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(gen.comision)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentOfTotal}%`,
                              backgroundColor: GENERATION_COLORS[gen.generation],
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
                <TableCell className="text-right">18%</TableCell>
                <TableCell className="text-right">{formatNumber(totalDistributors)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totalCommission)}</TableCell>
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
                  style={{ backgroundColor: GENERATION_COLORS[selectedGeneration ?? 0] }}
                />
                Detalle Generación G{selectedGeneration}
              </SheetTitle>
              <SheetDescription>
                Distribuidores en la generación G{selectedGeneration} ({GENERATION_NAMES[selectedGeneration ?? 0]})
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
