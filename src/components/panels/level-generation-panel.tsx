'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  getCommissionsByLevelGeneration,
  getCommissionDetails,
  type LevelGenerationBreakdown,
} from '@/lib/api';
import { formatNumber, GENERATION_COLORS, GENERATION_NAMES } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { Grid3X3, ChevronRight, Info } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface LevelGenerationPanelProps {
  distributorId: number;
  periodId: number;
}

export function LevelGenerationPanel({ distributorId, periodId }: LevelGenerationPanelProps) {
  const { formatCurrency } = useCurrency();
  const [selectedCell, setSelectedCell] = useState<{ nivel: number; generation: number } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['commissions-level-generation', distributorId, periodId],
    queryFn: () => getCommissionsByLevelGeneration(distributorId, periodId),
    enabled: !isNaN(distributorId) && !isNaN(periodId),
  });

  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['commission-details-cell', distributorId, periodId, selectedCell?.nivel, selectedCell?.generation],
    queryFn: () => getCommissionDetails(distributorId, periodId, {
      nivel: selectedCell?.nivel,
      generation: selectedCell?.generation,
      limit: 10000, // Sin límite práctico - mostrar todos
    }),
    enabled: selectedCell !== null && detailsOpen,
  });

  // Organize data into a matrix structure
  const buildMatrix = (data: LevelGenerationBreakdown[] | undefined) => {
    if (!data) return { matrix: {}, levels: [], generations: [], totals: { byLevel: {}, byGeneration: {}, grand: 0 } };

    const matrix: Record<number, Record<number, LevelGenerationBreakdown>> = {};
    const levelsSet = new Set<number>();
    const generationsSet = new Set<number>();
    const totals = {
      byLevel: {} as Record<number, { commission: number; count: number }>,
      byGeneration: {} as Record<number, { commission: number; count: number }>,
      grand: 0,
    };

    data.forEach((item) => {
      levelsSet.add(item.nivel);
      generationsSet.add(item.generation);

      if (!matrix[item.nivel]) matrix[item.nivel] = {};
      matrix[item.nivel][item.generation] = item;

      // Calculate totals by level
      if (!totals.byLevel[item.nivel]) totals.byLevel[item.nivel] = { commission: 0, count: 0 };
      totals.byLevel[item.nivel].commission += item.comision;
      totals.byLevel[item.nivel].count += item.personas;

      // Calculate totals by generation
      if (!totals.byGeneration[item.generation]) totals.byGeneration[item.generation] = { commission: 0, count: 0 };
      totals.byGeneration[item.generation].commission += item.comision;
      totals.byGeneration[item.generation].count += item.personas;

      totals.grand += item.comision;
    });

    const levels = Array.from(levelsSet).sort((a, b) => a - b);
    const generations = Array.from(generationsSet).sort((a, b) => a - b);

    return { matrix, levels, generations, totals };
  };

  const { matrix, levels, generations, totals } = buildMatrix(data);

  const handleCellClick = (nivel: number, generation: number) => {
    setSelectedCell({ nivel, generation });
    setDetailsOpen(true);
  };

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
            <Grid3X3 className="h-5 w-5" />
            Matriz Nivel × Generación
          </CardTitle>
          <CardDescription>
            Visualiza cómo se distribuyen las comisiones cruzando el nivel multinivel (ML1-ML3) con la generación (G0-G4).
            Haz clic en cualquier celda para ver el detalle de distribuidores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Nivel</TableHead>
                  {generations.map((gen) => (
                    <TableHead key={gen} className="text-center min-w-32">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          style={{ backgroundColor: GENERATION_COLORS[gen] }}
                          className="text-white"
                        >
                          G{gen}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {gen <= 2 ? (gen === 0 ? '4%' : '5%') : '2%'}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center bg-gray-50 font-bold">Total Nivel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((nivel) => (
                  <TableRow key={nivel}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">ML{nivel}</Badge>
                    </TableCell>
                    {generations.map((gen) => {
                      const cell = matrix[nivel]?.[gen];
                      const hasData = cell && cell.comision > 0;

                      return (
                        <TableCell
                          key={gen}
                          className={`text-center ${hasData ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                          onClick={() => hasData && handleCellClick(nivel, gen)}
                        >
                          {hasData ? (
                            <div className="space-y-1">
                              <p className="font-medium text-sm">
                                {formatCurrency(cell.comision)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatNumber(cell.personas)} dist.
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-gray-50">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">
                          {formatCurrency(totals.byLevel[nivel]?.commission || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(totals.byLevel[nivel]?.count || 0)} dist.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow className="bg-gray-50">
                  <TableCell className="font-bold">Total Gen</TableCell>
                  {generations.map((gen) => (
                    <TableCell key={gen} className="text-center">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">
                          {formatCurrency(totals.byGeneration[gen]?.commission || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatNumber(totals.byGeneration[gen]?.count || 0)} dist.
                        </p>
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-center bg-green-50">
                    <div className="space-y-1">
                      <p className="font-bold text-green-700">
                        {formatCurrency(totals.grand)}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        Comisión bruta
                        <InfoTooltip content="Esta es la comisión bruta (suma de todas las comisiones individuales de la red). La comisión neta real puede ser menor debido a roll-over, retenciones u otras reglas del plan." />
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Heatmap Legend */}
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>Generaciones más altas (G3-G4) indican mayor profundidad vertical</span>
          </div>
        </CardContent>
      </Card>

      {/* Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Detalle ML{selectedCell?.nivel} × G{selectedCell?.generation}
              </SheetTitle>
              <SheetDescription>
                Distribuidores en nivel multinivel {selectedCell?.nivel} y generación {selectedCell?.generation}
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
