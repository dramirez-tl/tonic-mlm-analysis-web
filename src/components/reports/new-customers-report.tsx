'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getNewCustomersPeriods,
  getNewCustomersSummary,
  getNewCustomersByZone,
  getNewCustomersDetail,
  NewCustomersPeriod,
  NewCustomersByZone,
  NewCustomerDetail,
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
import { BarChart3, MapPin, Users, Download, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';

// Kit type colors and labels
const kitColors: Record<string, string> = {
  'basico': 'bg-blue-500 text-white',
  'premium': 'bg-purple-600 text-white',
  'sin_kit': 'bg-gray-400 text-white',
};

const kitLabels: Record<string, string> = {
  'basico': 'Basico',
  'premium': 'Premium',
  'sin_kit': 'Sin Kit',
};

function getKitBadgeClass(kitType: string): string {
  return kitColors[kitType] || 'bg-gray-500 text-white';
}

function getKitLabel(kitType: string): string {
  return kitLabels[kitType] || kitType;
}

export function NewCustomersReport() {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  // Detail filters
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterKit, setFilterKit] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');

  // Fetch available periods
  const { data: periods, isLoading: periodsLoading } = useQuery({
    queryKey: ['newCustomersPeriods'],
    queryFn: getNewCustomersPeriods,
  });

  // Set initial period when periods load
  useEffect(() => {
    if (periods && periods.length > 0 && selectedPeriodId === null) {
      setSelectedPeriodId(periods[0].id_period);
    }
  }, [periods, selectedPeriodId]);

  // Fetch summary data
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['newCustomersSummary', selectedPeriodId],
    queryFn: () => getNewCustomersSummary(selectedPeriodId!),
    enabled: !!selectedPeriodId,
  });

  // Fetch by zone data
  const { data: byZoneData, isLoading: byZoneLoading } = useQuery({
    queryKey: ['newCustomersByZone', selectedPeriodId],
    queryFn: () => getNewCustomersByZone(selectedPeriodId!),
    enabled: !!selectedPeriodId && activeTab === 'byZone',
  });

  // Fetch detail data
  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['newCustomersDetail', selectedPeriodId],
    queryFn: () => getNewCustomersDetail(selectedPeriodId!),
    enabled: !!selectedPeriodId && activeTab === 'detail',
  });

  // Get the selected period info
  const selectedPeriod = useMemo(() => {
    if (!periods || selectedPeriodId === null) return null;
    return periods.find(p => p.id_period === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  // Process summary data - simple table with kit types
  const summaryTotals = useMemo(() => {
    if (!summaryData) return { kits: [], total: 0 };

    const kitOrder = ['basico', 'premium', 'sin_kit'];
    const sorted = [...summaryData].sort((a, b) =>
      kitOrder.indexOf(a.kit_type) - kitOrder.indexOf(b.kit_type)
    );
    const total = sorted.reduce((sum, item) => sum + item.count, 0);

    return { kits: sorted, total };
  }, [summaryData]);

  // Group by zone data by zone
  const byZoneGrouped = useMemo((): Map<string, NewCustomersByZone[]> => {
    if (!byZoneData) return new Map<string, NewCustomersByZone[]>();

    const grouped = new Map<string, NewCustomersByZone[]>();
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
      kits: [allOption],
      countries: [allOption]
    };

    const zonesSet = new Set<string>();
    const kitsSet = new Set<string>();
    const countriesSet = new Set<string>();

    detailData.forEach((item) => {
      zonesSet.add(item.branch_name);
      kitsSet.add(item.kit_type);
      countriesSet.add(item.country_name);
    });

    const toOptions = (arr: string[], labelFn?: (v: string) => string): ComboboxOption[] =>
      [{ value: 'all', label: 'Todos' }, ...arr.map(v => ({ value: v, label: labelFn ? labelFn(v) : v }))];

    return {
      zones: toOptions(Array.from(zonesSet).sort()),
      kits: toOptions(Array.from(kitsSet).sort(), getKitLabel),
      countries: toOptions(Array.from(countriesSet).sort()),
    };
  }, [detailData]);

  // Filtered detail data
  const filteredDetailData = useMemo(() => {
    if (!detailData) return [];

    return detailData.filter((item) => {
      if (filterZone !== 'all' && item.branch_name !== filterZone) return false;
      if (filterKit !== 'all' && item.kit_type !== filterKit) return false;
      if (filterCountry !== 'all' && item.country_name !== filterCountry) return false;
      return true;
    });
  }, [detailData, filterZone, filterKit, filterCountry]);

  // Reset filters when period changes
  useEffect(() => {
    setFilterZone('all');
    setFilterKit('all');
    setFilterCountry('all');
  }, [selectedPeriodId]);

  // Export to CSV
  const exportToCSV = (type: 'summary' | 'byZone' | 'detail') => {
    let csvContent = '';
    let filename = '';
    const periodName = selectedPeriod?.name_period || 'periodo';

    if (type === 'summary' && summaryData) {
      csvContent = 'Periodo,Tipo Kit,Cantidad\n';
      summaryData.forEach((item) => {
        csvContent += `"${item.period_name}","${getKitLabel(item.kit_type)}",${item.count}\n`;
      });
      filename = `nuevos_clientes_resumen_${periodName.replace(/\s+/g, '_')}.csv`;
    } else if (type === 'byZone' && byZoneData) {
      csvContent = 'Periodo,Zona,Pais,Tipo Kit,Cantidad\n';
      byZoneData.forEach((item) => {
        csvContent += `"${item.period_name}","${item.branch_name}","${item.country_code}","${getKitLabel(item.kit_type)}",${item.count}\n`;
      });
      filename = `nuevos_clientes_por_zona_${periodName.replace(/\s+/g, '_')}.csv`;
    } else if (type === 'detail' && filteredDetailData.length > 0) {
      csvContent = 'ID,Nombre,Tipo,Fecha Registro,Pais,Zona,Kit,Periodo\n';
      filteredDetailData.forEach((item) => {
        csvContent += `${item.id_customers},"${item.full_name}","${item.customer_type}","${item.date_registration}","${item.country_name}","${item.branch_name}","${getKitLabel(item.kit_type)}","${item.period_name}"\n`;
      });
      const filterSuffix = (filterZone !== 'all' || filterKit !== 'all' || filterCountry !== 'all') ? '_filtrado' : '';
      filename = `nuevos_clientes_detalle_${periodName.replace(/\s+/g, '_')}${filterSuffix}.csv`;
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

  if (periodsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Periodo:</label>
          <Select
            value={selectedPeriodId?.toString() || ''}
            onValueChange={(value) => setSelectedPeriodId(parseInt(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar periodo" />
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
          ) : summaryTotals.kits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de nuevos clientes para {selectedPeriod?.name_period || 'este periodo'}
            </div>
          ) : (
            <div className="max-w-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo de Kit</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryTotals.kits.map((item) => (
                    <TableRow key={item.kit_type}>
                      <TableCell>
                        <Badge className={getKitBadgeClass(item.kit_type)}>
                          <Package className="h-3 w-3 mr-1" />
                          {getKitLabel(item.kit_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {summaryTotals.total.toLocaleString()}
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
              No hay datos de nuevos clientes por zona para {selectedPeriod?.name_period || 'este periodo'}
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(byZoneGrouped.entries()).map(([zoneName, items]) => {
                const total = items.reduce((sum, item) => sum + item.count, 0);
                const kitOrder = ['basico', 'premium', 'sin_kit'];
                const sortedItems = [...items].sort((a, b) =>
                  kitOrder.indexOf(a.kit_type) - kitOrder.indexOf(b.kit_type)
                );

                return (
                  <div key={zoneName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-secondary" />
                        {zoneName}
                      </h3>
                      <Badge variant="outline">{total.toLocaleString()} nuevos clientes</Badge>
                    </div>
                    <div className="max-w-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo de Kit</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedItems.map((item) => (
                            <TableRow key={item.kit_type}>
                              <TableCell>
                                <Badge className={getKitBadgeClass(item.kit_type)}>
                                  <Package className="h-3 w-3 mr-1" />
                                  {getKitLabel(item.kit_type)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {item.count.toLocaleString()}
                              </TableCell>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border">
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

              {/* Kit Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Tipo de Kit</label>
                <Combobox
                  options={detailFilterOptions.kits}
                  value={filterKit}
                  onValueChange={setFilterKit}
                  placeholder="Todos los kits"
                  searchPlaceholder="Buscar kit..."
                  emptyText="No se encontraron kits"
                />
              </div>

              {/* Country Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Pais</label>
                <Combobox
                  options={detailFilterOptions.countries}
                  value={filterCountry}
                  onValueChange={setFilterCountry}
                  placeholder="Todos los paises"
                  searchPlaceholder="Buscar pais..."
                  emptyText="No se encontraron paises"
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
              No hay detalle de nuevos clientes para {selectedPeriod?.name_period || 'este periodo'}
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Pais</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Kit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDetailData.slice(0, 500).map((item, index) => (
                    <TableRow key={`${item.id_customers}-${index}`}>
                      <TableCell className="font-mono">{item.id_customers}</TableCell>
                      <TableCell>{item.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.customer_type}</Badge>
                      </TableCell>
                      <TableCell>{item.date_registration}</TableCell>
                      <TableCell>{item.country_name}</TableCell>
                      <TableCell className="text-sm">{item.branch_name}</TableCell>
                      <TableCell>
                        <Badge className={getKitBadgeClass(item.kit_type)}>
                          <Package className="h-3 w-3 mr-1" />
                          {getKitLabel(item.kit_type)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 text-sm text-muted-foreground text-right">
                Mostrando {Math.min(filteredDetailData.length, 500)} de {filteredDetailData.length} clientes
                {filteredDetailData.length > 500 && ' (limitado a 500 filas)'}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
