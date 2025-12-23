'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  getCampamentoRankingMexico,
  getCampamentoRankingUSA,
  CampamentoParticipante,
  CampamentoRanking,
} from '@/lib/api';
import { getCachedData, setCachedData, getCacheInfo } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Button } from '@/components/ui/button';
import {
  Download,
  Users,
  ChevronRight,
  ArrowUp,
  RefreshCw,
  Database,
  Clock,
} from 'lucide-react';

// Colores de rangos
const rankColors: Record<string, string> = {
  'Distribuidor': 'bg-gray-400 text-white',
  'Bronce': 'bg-amber-700 text-white',
  'Plata': 'bg-gray-500 text-white',
  'Oro': 'bg-yellow-500 text-black',
  'Platino': 'bg-slate-600 text-white',
  'Diamante': 'bg-cyan-400 text-white',
  'Doble Diamante': 'bg-cyan-600 text-white',
  'Triple Diamante': 'bg-cyan-800 text-white',
  'Diamante Sirius': 'bg-purple-600 text-white',
  'Azul': 'bg-blue-600 text-white',
};

function getRankBadgeClass(rankName: string): string {
  return rankColors[rankName] || 'bg-gray-500 text-white';
}

function formatNumber(num: number): string {
  return num.toLocaleString('es-MX');
}

// Keys de caché
const CACHE_KEY_MEXICO = 'ranking_mexico';
const CACHE_KEY_USA = 'ranking_usa';

// Flag para deshabilitar caché temporalmente
const DISABLE_SUPABASE_CACHE = false;

// Función para obtener datos con caché
async function fetchRankingWithCache(
  country: 'mexico' | 'usa',
  forceRefresh: boolean = false
): Promise<CampamentoRanking> {
  const cacheKey = country === 'mexico' ? CACHE_KEY_MEXICO : CACHE_KEY_USA;
  const fetchFn = country === 'mexico' ? getCampamentoRankingMexico : getCampamentoRankingUSA;

  // Si el caché está deshabilitado, ir directo a la API
  if (DISABLE_SUPABASE_CACHE) {
    console.log(`[API] Obteniendo datos de ${country} desde la API (caché deshabilitado)...`);
    return await fetchFn();
  }

  // Si no es forzar refresh, intentar obtener del caché primero
  if (!forceRefresh) {
    try {
      const cachedData = await getCachedData<CampamentoRanking>(cacheKey);
      if (cachedData) {
        console.log(`[Cache] Datos de ${country} obtenidos del caché`);
        return cachedData;
      }
    } catch (error) {
      console.warn(`[Cache] Error al obtener caché de ${country}:`, error);
    }
  }

  // Si no hay caché o es refresh forzado, obtener de la API
  console.log(`[API] Obteniendo datos de ${country} desde la API...`);
  const freshData = await fetchFn();

  // Guardar en caché
  try {
    const saved = await setCachedData(cacheKey, freshData);
    if (saved) {
      console.log(`[Cache] Datos de ${country} guardados en caché`);
    }
  } catch (error) {
    console.warn(`[Cache] Error al guardar caché de ${country}:`, error);
  }

  return freshData;
}

export function CampamentoRankingView() {
  const [activeTab, setActiveTab] = useState<'mexico' | 'usa'>('mexico');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheInfoMexico, setCacheInfoMexico] = useState<string | null>(null);
  const [cacheInfoUSA, setCacheInfoUSA] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch ranking Mexico
  const { data: rankingMexico, isLoading: loadingMexico } = useQuery({
    queryKey: ['campamentoRankingMexico'],
    queryFn: () => fetchRankingWithCache('mexico'),
    staleTime: Infinity, // Nunca se considera stale ya que usamos caché persistente
  });

  // Fetch ranking USA
  const { data: rankingUSA, isLoading: loadingUSA } = useQuery({
    queryKey: ['campamentoRankingUSA'],
    queryFn: () => fetchRankingWithCache('usa'),
    staleTime: Infinity,
    enabled: !loadingMexico,
  });

  // Cargar info del caché al montar (deshabilitado temporalmente)
  React.useEffect(() => {
    if (DISABLE_SUPABASE_CACHE) return;

    async function loadCacheInfo() {
      try {
        const infoMX = await getCacheInfo(CACHE_KEY_MEXICO);
        const infoUSA = await getCacheInfo(CACHE_KEY_USA);

        if (infoMX.exists && infoMX.updatedAt) {
          setCacheInfoMexico(new Date(infoMX.updatedAt).toLocaleString('es-MX'));
        }
        if (infoUSA.exists && infoUSA.updatedAt) {
          setCacheInfoUSA(new Date(infoUSA.updatedAt).toLocaleString('es-MX'));
        }
      } catch (error) {
        console.warn('[Cache] Error al cargar info del caché:', error);
      }
    }
    loadCacheInfo();
  }, [rankingMexico, rankingUSA]);

  // Función para refrescar datos
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refrescar ambos países
      const [dataMexico, dataUSA] = await Promise.all([
        fetchRankingWithCache('mexico', true),
        fetchRankingWithCache('usa', true),
      ]);

      // Actualizar el query cache
      queryClient.setQueryData(['campamentoRankingMexico'], dataMexico);
      queryClient.setQueryData(['campamentoRankingUSA'], dataUSA);

      // Actualizar info del caché
      const now = new Date().toLocaleString('es-MX');
      setCacheInfoMexico(now);
      setCacheInfoUSA(now);
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // Memorizar el ranking actual
  const currentRanking = useMemo(() => {
    return activeTab === 'mexico' ? rankingMexico : rankingUSA;
  }, [activeTab, rankingMexico, rankingUSA]);

  // Memorizar el handler para evitar re-renders
  const handleVerDetalle = useCallback((idLider: number) => {
    router.push(`/dashboard/campamento/lider/${idLider}`);
  }, [router]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (!currentRanking) return;

    const headers = ['Posicion', 'ID', 'Nombre', 'Rango Inicial', 'Rango Actual', 'Pts Patrocinios', 'Pts Rango', 'Pts Equipo', 'Total'];
    let csv = headers.join(',') + '\n';

    currentRanking.ranking.forEach((p, idx) => {
      csv += `${idx + 1},${p.id_customers},"${p.full_name}","${p.rango_inicial}","${p.rango_actual}",${p.puntos_parte1},${p.puntos_parte2},${p.puntos_parte3},${p.puntos_total}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campamento_${activeTab}_ranking.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentRanking, activeTab]);

  // Memorizar los datos de las tablas
  const rankingMexicoData = useMemo(() => rankingMexico?.ranking || [], [rankingMexico]);
  const rankingUSAData = useMemo(() => rankingUSA?.ranking || [], [rankingUSA]);

  const currentCacheInfo = activeTab === 'mexico' ? cacheInfoMexico : cacheInfoUSA;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mexico' | 'usa')}>
        {/* Header minimalista */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-6">
            {/* Tabs integrados */}
            <TabsList className="bg-muted/50 p-1 h-10">
              <TabsTrigger
                value="mexico"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 h-8"
              >
                <span className="mr-2">🇲🇽</span>
                <span className="font-medium">Mexico</span>
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">50</span>
              </TabsTrigger>
              <TabsTrigger
                value="usa"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 h-8"
              >
                <span className="mr-2">🇺🇸</span>
                <span className="font-medium">USA</span>
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">25</span>
              </TabsTrigger>
            </TabsList>

            {/* Separador */}
            <div className="h-6 w-px bg-border" />

            {/* Info del periodo */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Periodo: <span className="font-medium text-foreground">Mar - Ago 2025</span></span>
            </div>

            {/* Info del caché */}
            {currentCacheInfo && (
              <>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Database className="h-3 w-3" />
                  <span>Datos: {currentCacheInfo}</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loadingMexico || loadingUSA}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar Datos'}
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!currentRanking}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <TabsContent value="mexico" className="mt-4">
          <RankingTable
            ranking={rankingMexicoData}
            isLoading={loadingMexico}
            cupos={50}
            rangoMinimo="Oro"
            onVerDetalle={handleVerDetalle}
          />
        </TabsContent>

        <TabsContent value="usa" className="mt-4">
          <RankingTable
            ranking={rankingUSAData}
            isLoading={loadingUSA}
            cupos={25}
            rangoMinimo="Plata"
            onVerDetalle={handleVerDetalle}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de tabla de ranking - Memorizado
interface RankingTableProps {
  ranking: CampamentoParticipante[];
  isLoading: boolean;
  cupos: number;
  rangoMinimo: string;
  onVerDetalle: (id: number) => void;
}

const RankingTable = memo(function RankingTable({ ranking, isLoading, cupos, rangoMinimo, onVerDetalle }: RankingTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Rango minimo: <Badge className={getRankBadgeClass(rangoMinimo)}>{rangoMinimo}</Badge></span>
        <span>Participantes: {ranking.length} | Cupos: {cupos}</span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead>Lider</TableHead>
              <TableHead className="text-center">Rango Inicial</TableHead>
              <TableHead className="text-center">Rango Actual</TableHead>
              <TableHead className="text-right">Parte 1</TableHead>
              <TableHead className="text-right">Parte 2</TableHead>
              <TableHead className="text-right">Parte 3</TableHead>
              <TableHead className="text-right font-bold">Total</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No hay participantes registrados
                </TableCell>
              </TableRow>
            ) : (
              ranking.map((p, idx) => (
                <TableRow
                  key={p.id_customers}
                  className={idx < cupos ? 'bg-green-50/50 hover:bg-green-100/50' : 'bg-red-50/30 hover:bg-red-100/30'}
                >
                  <TableCell className="text-center font-bold">
                    {idx < 3 ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        'bg-amber-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">ID: {p.id_customers}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getRankBadgeClass(p.rango_inicial)} variant="secondary">
                      {p.rango_inicial}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getRankBadgeClass(p.rango_actual)} variant="secondary">
                      {p.rango_actual}
                    </Badge>
                    {p.rango_actual !== p.rango_inicial && (
                      <ArrowUp className="inline h-3 w-3 ml-1 text-green-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(p.puntos_parte1)}</TableCell>
                  <TableCell className="text-right">{formatNumber(p.puntos_parte2)}</TableCell>
                  <TableCell className="text-right">{formatNumber(p.puntos_parte3)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatNumber(p.puntos_total)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVerDetalle(p.id_customers)}
                    >
                      Ver <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
