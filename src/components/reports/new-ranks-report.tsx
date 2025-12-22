'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getNewRanksYears,
  getNewRanksSummary,
  getNewRanksByZone,
  getNewRanksDetail,
  NewRankSummary,
  NewRankByZone,
  NewRankDetail,
} from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, MapPin, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

// Rank colors for badges
const rankColors: Record<string, string> = {
  'BRONCE': 'bg-amber-700 text-white',
  'PLATA': 'bg-gray-400 text-white',
  'ORO': 'bg-yellow-500 text-white',
  'PLATINO': 'bg-slate-600 text-white',
  'DIAMANTE': 'bg-cyan-400 text-white',
  'DOBLE DIAMANTE': 'bg-cyan-600 text-white',
  'TRIPLE DIAMANTE': 'bg-cyan-800 text-white',
  'SIRIUS': 'bg-purple-600 text-white',
  'AZUL': 'bg-blue-600 text-white',
};

function getRankBadgeClass(rankName: string): string {
  return rankColors[rankName] || 'bg-gray-500 text-white';
}

// Helper to extract month from period name (e.g., "ENERO 2025" -> "Enero")
function extractMonth(periodName: string): string {
  const parts = periodName.split(' ');
  if (parts.length > 0) {
    const month = parts[0].charAt(0) + parts[0].slice(1).toLowerCase();
    return month;
  }
  return periodName;
}

export function NewRanksReport() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('summary');

  // Detail filters
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterPreviousRank, setFilterPreviousRank] = useState<string>('all');
  const [filterNewRank, setFilterNewRank] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  // Fetch available years
  const { data: years, isLoading: yearsLoading } = useQuery({
    queryKey: ['newRanksYears'],
    queryFn: getNewRanksYears,
  });

  // Fetch summary data
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['newRanksSummary', selectedYear],
    queryFn: () => getNewRanksSummary(selectedYear),
    enabled: !!selectedYear,
  });

  // Fetch by zone data
  const { data: byZoneData, isLoading: byZoneLoading } = useQuery({
    queryKey: ['newRanksByZone', selectedYear],
    queryFn: () => getNewRanksByZone(selectedYear),
    enabled: !!selectedYear && activeTab === 'byZone',
  });

  // Fetch detail data
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['newRanksDetail', selectedYear],
    queryFn: () => getNewRanksDetail(selectedYear),
    enabled: !!selectedYear && activeTab === 'detail',
  });

  // Set year when years load
  useMemo(() => {
    if (years && years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // Process summary data for pivot table
  const summaryPivot = useMemo(() => {
    if (!summaryData) return { periods: [], ranks: [], data: new Map() };

    const periodsSet = new Set<string>();
    const ranksSet = new Set<string>();
    const dataMap = new Map<string, number>();

    summaryData.forEach((item) => {
      periodsSet.add(item.period_name);
      ranksSet.add(item.rank_name);
      dataMap.set(`${item.period_name}-${item.rank_name}`, item.count);
    });

    // Sort periods by period_id (assuming chronological)
    const periods = Array.from(periodsSet);
    // Sort ranks by rank_id
    const rankOrder = ['BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE', 'DOBLE DIAMANTE', 'TRIPLE DIAMANTE', 'SIRIUS', 'AZUL'];
    const ranks = Array.from(ranksSet).sort((a, b) => rankOrder.indexOf(a) - rankOrder.indexOf(b));

    return { periods, ranks, data: dataMap };
  }, [summaryData]);

  // Calculate totals for summary
  const summaryTotals = useMemo(() => {
    const periodTotals = new Map<string, number>();
    const rankTotals = new Map<string, number>();
    let grandTotal = 0;

    summaryPivot.periods.forEach((period) => {
      let periodSum = 0;
      summaryPivot.ranks.forEach((rank) => {
        const count = summaryPivot.data.get(`${period}-${rank}`) || 0;
        periodSum += count;
        rankTotals.set(rank, (rankTotals.get(rank) || 0) + count);
      });
      periodTotals.set(period, periodSum);
      grandTotal += periodSum;
    });

    return { periodTotals, rankTotals, grandTotal };
  }, [summaryPivot]);

  // Group by zone data by zone
  const byZoneGrouped = useMemo((): Map<string, NewRankByZone[]> => {
    if (!byZoneData) return new Map<string, NewRankByZone[]>();

    const grouped = new Map<string, NewRankByZone[]>();
    byZoneData.forEach((item) => {
      const key = `${item.branch_name} (${item.country_code})`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });

    return grouped;
  }, [byZoneData]);

  // Extract filter options from detail data as ComboboxOption[]
  const detailFilterOptions = useMemo(() => {
    const allOption: ComboboxOption = { value: 'all', label: 'Todos' };
    if (!detailData) return {
      zones: [allOption],
      previousRanks: [allOption],
      newRanks: [allOption],
      periods: [allOption]
    };

    const zonesSet = new Set<string>();
    const previousRanksSet = new Set<string>();
    const newRanksSet = new Set<string>();
    const periodsSet = new Set<string>();

    detailData.forEach((item) => {
      zonesSet.add(`${item.branch_name} (${item.country_code})`);
      previousRanksSet.add(item.previous_rank_name);
      newRanksSet.add(item.new_rank_name);
      periodsSet.add(item.period_name);
    });

    const rankOrder = ['Distribuidor', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Doble Diamante', 'Triple Diamante', 'Diamante Azul', 'Diamante Sirius'];

    const toOptions = (arr: string[]): ComboboxOption[] =>
      [{ value: 'all', label: 'Todos' }, ...arr.map(v => ({ value: v, label: v }))];

    return {
      zones: toOptions(Array.from(zonesSet).sort()),
      previousRanks: toOptions(Array.from(previousRanksSet).sort((a, b) => rankOrder.indexOf(a) - rankOrder.indexOf(b))),
      newRanks: toOptions(Array.from(newRanksSet).sort((a, b) => rankOrder.indexOf(a) - rankOrder.indexOf(b))),
      periods: toOptions(Array.from(periodsSet)),
    };
  }, [detailData]);

  // Filtered detail data
  const filteredDetailData = useMemo(() => {
    if (!detailData) return [];

    return detailData.filter((item) => {
      const zoneKey = `${item.branch_name} (${item.country_code})`;
      if (filterZone !== 'all' && zoneKey !== filterZone) return false;
      if (filterPreviousRank !== 'all' && item.previous_rank_name !== filterPreviousRank) return false;
      if (filterNewRank !== 'all' && item.new_rank_name !== filterNewRank) return false;
      if (filterPeriod !== 'all' && item.period_name !== filterPeriod) return false;
      return true;
    });
  }, [detailData, filterZone, filterPreviousRank, filterNewRank, filterPeriod]);

  // Reset filters when year changes
  useMemo(() => {
    setFilterZone('all');
    setFilterPreviousRank('all');
    setFilterNewRank('all');
    setFilterPeriod('all');
  }, [selectedYear]);

  // Export to CSV
  const exportToCSV = (type: 'summary' | 'byZone' | 'detail') => {
    let csvContent = '';
    let filename = '';

    if (type === 'summary' && summaryData) {
      csvContent = 'Periodo,Rango,Cantidad\n';
      summaryData.forEach((item) => {
        csvContent += `"${item.period_name}","${item.rank_name}",${item.count}\n`;
      });
      filename = `nuevos_rangos_resumen_${selectedYear}.csv`;
    } else if (type === 'byZone' && byZoneData) {
      csvContent = 'Periodo,Zona,Pais,Rango,Cantidad\n';
      byZoneData.forEach((item) => {
        csvContent += `"${item.period_name}","${item.branch_name}","${item.country_code}","${item.rank_name}",${item.count}\n`;
      });
      filename = `nuevos_rangos_por_zona_${selectedYear}.csv`;
    } else if (type === 'detail' && filteredDetailData.length > 0) {
      csvContent = 'ID,Nombre,Zona,Pais,Rango Anterior,Nuevo Rango,Periodo\n';
      filteredDetailData.forEach((item) => {
        csvContent += `${item.id_customers},"${item.full_name}","${item.branch_name}","${item.country_code}","${item.previous_rank_name}","${item.new_rank_name}","${item.period_name}"\n`;
      });
      const filterSuffix = (filterZone !== 'all' || filterPreviousRank !== 'all' || filterNewRank !== 'all' || filterPeriod !== 'all') ? '_filtrado' : '';
      filename = `nuevos_rangos_detalle_${selectedYear}${filterSuffix}.csv`;
    }

    if (csvContent) {
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
    }
  };

  if (yearsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Año:</label>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Seleccionar ano" />
            </SelectTrigger>
            <SelectContent>
              {years?.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="byZone" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Por Zona
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Detalle
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV('summary')}
              disabled={!summaryData || summaryData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : summaryPivot.periods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de nuevos rangos para {selectedYear}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white">Rango</TableHead>
                    {summaryPivot.periods.map((period) => (
                      <TableHead key={period} className="text-center min-w-[80px]">
                        {extractMonth(period)}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold bg-gray-50">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryPivot.ranks.map((rank) => (
                    <TableRow key={rank}>
                      <TableCell className="sticky left-0 bg-white">
                        <Badge className={getRankBadgeClass(rank)}>{rank}</Badge>
                      </TableCell>
                      {summaryPivot.periods.map((period) => {
                        const count = summaryPivot.data.get(`${period}-${rank}`) || 0;
                        return (
                          <TableCell key={`${period}-${rank}`} className="text-center">
                            {count > 0 ? count : '-'}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold bg-gray-50">
                        {summaryTotals.rankTotals.get(rank) || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell className="sticky left-0 bg-gray-50">Total</TableCell>
                    {summaryPivot.periods.map((period) => (
                      <TableCell key={`total-${period}`} className="text-center">
                        {summaryTotals.periodTotals.get(period) || 0}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-secondary/20">
                      {summaryTotals.grandTotal}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* By Zone Tab */}
        <TabsContent value="byZone" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV('byZone')}
              disabled={!byZoneData || byZoneData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
          {byZoneLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : byZoneGrouped.size === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de nuevos rangos por zona para {selectedYear}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(byZoneGrouped.entries()).map(([zoneName, items]) => {
                // Create pivot for this zone
                const periodsSet = new Set<string>();
                const ranksSet = new Set<string>();
                const dataMap = new Map<string, number>();

                items.forEach((item) => {
                  periodsSet.add(item.period_name);
                  ranksSet.add(item.rank_name);
                  dataMap.set(`${item.period_name}-${item.rank_name}`, item.count);
                });

                const periods = Array.from(periodsSet);
                const rankOrder = ['BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE', 'DOBLE DIAMANTE', 'TRIPLE DIAMANTE', 'SIRIUS', 'AZUL'];
                const ranks = Array.from(ranksSet).sort((a, b) => rankOrder.indexOf(a) - rankOrder.indexOf(b));

                const total = items.reduce((sum, item) => sum + item.count, 0);

                return (
                  <div key={zoneName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-secondary" />
                        {zoneName}
                      </h3>
                      <Badge variant="outline">{total} nuevos rangos</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rango</TableHead>
                            {periods.map((period) => (
                              <TableHead key={period} className="text-center min-w-[80px]">
                                {extractMonth(period)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ranks.map((rank) => (
                            <TableRow key={rank}>
                              <TableCell>
                                <Badge className={getRankBadgeClass(rank)}>{rank}</Badge>
                              </TableCell>
                              {periods.map((period) => {
                                const count = dataMap.get(`${period}-${rank}`) || 0;
                                return (
                                  <TableCell key={`${period}-${rank}`} className="text-center">
                                    {count > 0 ? count : '-'}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Detail Tab */}
        <TabsContent value="detail" className="mt-4">
          <div className="flex flex-col gap-4 mb-4">
            {/* Filters Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
              {/* Zone Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Zona</label>
                <Combobox
                  options={detailFilterOptions.zones}
                  value={filterZone}
                  onValueChange={setFilterZone}
                  placeholder="Todas las zonas"
                  searchPlaceholder="Buscar zona..."
                  emptyText="No se encontraron zonas"
                />
              </div>

              {/* Previous Rank Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Rango Anterior</label>
                <Combobox
                  options={detailFilterOptions.previousRanks}
                  value={filterPreviousRank}
                  onValueChange={setFilterPreviousRank}
                  placeholder="Todos los rangos"
                  searchPlaceholder="Buscar rango..."
                  emptyText="No se encontraron rangos"
                />
              </div>

              {/* New Rank Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Nuevo Rango</label>
                <Combobox
                  options={detailFilterOptions.newRanks}
                  value={filterNewRank}
                  onValueChange={setFilterNewRank}
                  placeholder="Todos los rangos"
                  searchPlaceholder="Buscar rango..."
                  emptyText="No se encontraron rangos"
                />
              </div>

              {/* Period Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Periodo</label>
                <Combobox
                  options={detailFilterOptions.periods}
                  value={filterPeriod}
                  onValueChange={setFilterPeriod}
                  placeholder="Todos los periodos"
                  searchPlaceholder="Buscar periodo..."
                  emptyText="No se encontraron periodos"
                />
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV('detail')}
                disabled={filteredDetailData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
          {detailLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !detailData || detailData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay detalle de nuevos rangos para {selectedYear}
            </div>
          ) : filteredDetailData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay resultados con los filtros seleccionados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Rango Anterior</TableHead>
                    <TableHead>Nuevo Rango</TableHead>
                    <TableHead>Periodo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetailData.map((item, index) => (
                    <TableRow key={`${item.id_customers}-${item.new_rank_id}-${index}`}>
                      <TableCell className="font-mono">{item.id_customers}</TableCell>
                      <TableCell>{item.full_name}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {item.branch_name}
                          <span className="text-muted-foreground ml-1">({item.country_code})</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-600">
                          {item.previous_rank_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRankBadgeClass(item.new_rank_name)}>
                          {item.new_rank_name}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.period_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-sm text-muted-foreground text-right">
                Mostrando {filteredDetailData.length} de {detailData.length} distribuidores
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
