'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getCampamentoResumen,
  getCampamentoPatrocinios,
  getCampamentoEquipo,
  getCampamentoRangos,
  CampamentoResumen,
  CampamentoPatrocinios,
  CampamentoEquipo,
  CampamentoRangos,
  PatrocinioDetalle,
  CompraDetalle,
  RangoHistorial,
} from '@/lib/api';
import { getCachedData, setCachedData } from '@/lib/supabase';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  TrendingUp,
  UserPlus,
  Medal,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ArrowUp,
  Package,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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

interface CampamentoDetalleViewProps {
  liderId: number;
}

// Cache keys
const CACHE_KEY_RESUMEN = (id: number) => `lider_resumen_${id}`;
const CACHE_KEY_PATROCINIOS = (id: number) => `lider_patrocinios_${id}`;
const CACHE_KEY_EQUIPO = (id: number) => `lider_equipo_${id}`;
const CACHE_KEY_RANGOS = (id: number) => `lider_rangos_${id}`;

// Funciones para obtener datos con caché de Supabase
async function fetchResumenWithCache(liderId: number): Promise<CampamentoResumen> {
  const cacheKey = CACHE_KEY_RESUMEN(liderId);

  // Intentar obtener del caché
  const cached = await getCachedData<CampamentoResumen>(cacheKey);
  if (cached) {
    console.log(`[Cache] Resumen de lider ${liderId} obtenido del caché`);
    return cached;
  }

  // Si no hay caché, obtener de la API
  console.log(`[API] Obteniendo resumen de lider ${liderId}...`);
  const data = await getCampamentoResumen(liderId);

  // Guardar en caché
  await setCachedData(cacheKey, data);

  return data;
}

async function fetchPatrociniosWithCache(liderId: number): Promise<CampamentoPatrocinios> {
  const cacheKey = CACHE_KEY_PATROCINIOS(liderId);

  const cached = await getCachedData<CampamentoPatrocinios>(cacheKey);
  if (cached) {
    console.log(`[Cache] Patrocinios de lider ${liderId} obtenidos del caché`);
    return cached;
  }

  console.log(`[API] Obteniendo patrocinios de lider ${liderId}...`);
  const data = await getCampamentoPatrocinios(liderId);
  await setCachedData(cacheKey, data);

  return data;
}

async function fetchEquipoWithCache(liderId: number): Promise<CampamentoEquipo> {
  const cacheKey = CACHE_KEY_EQUIPO(liderId);

  const cached = await getCachedData<CampamentoEquipo>(cacheKey);
  if (cached) {
    console.log(`[Cache] Equipo de lider ${liderId} obtenido del caché`);
    return cached;
  }

  console.log(`[API] Obteniendo equipo de lider ${liderId}...`);
  const data = await getCampamentoEquipo(liderId);
  await setCachedData(cacheKey, data);

  return data;
}

async function fetchRangosWithCache(liderId: number): Promise<CampamentoRangos> {
  const cacheKey = CACHE_KEY_RANGOS(liderId);

  const cached = await getCachedData<CampamentoRangos>(cacheKey);
  if (cached) {
    console.log(`[Cache] Rangos de lider ${liderId} obtenidos del caché`);
    return cached;
  }

  console.log(`[API] Obteniendo rangos de lider ${liderId}...`);
  const data = await getCampamentoRangos(liderId);
  await setCachedData(cacheKey, data);

  return data;
}

export function CampamentoDetalleView({ liderId }: CampamentoDetalleViewProps) {
  const { data: resumen, isLoading: loadingResumen } = useQuery({
    queryKey: ['campamentoResumen', liderId],
    queryFn: () => fetchResumenWithCache(liderId),
    enabled: !!liderId,
    staleTime: Infinity, // Usamos caché persistente de Supabase
  });

  const { data: patrocinios, isLoading: loadingPatrocinios } = useQuery({
    queryKey: ['campamentoPatrocinios', liderId],
    queryFn: () => fetchPatrociniosWithCache(liderId),
    enabled: !!liderId,
    staleTime: Infinity,
  });

  const { data: equipo, isLoading: loadingEquipo } = useQuery({
    queryKey: ['campamentoEquipo', liderId],
    queryFn: () => fetchEquipoWithCache(liderId),
    enabled: !!liderId,
    staleTime: Infinity,
  });

  const { data: rangos, isLoading: loadingRangos } = useQuery({
    queryKey: ['campamentoRangos', liderId],
    queryFn: () => fetchRangosWithCache(liderId),
    enabled: !!liderId,
    staleTime: Infinity,
  });

  if (loadingResumen) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No se encontro informacion del lider
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info del lider */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold">
                {resumen.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{resumen.full_name}</h2>
                <p className="text-muted-foreground">ID: {resumen.id_customers}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRankBadgeClass(resumen.rango_inicial)} variant="secondary">
                    {resumen.rango_inicial}
                  </Badge>
                  {resumen.rango_actual !== resumen.rango_inicial && (
                    <>
                      <ArrowUp className="h-4 w-4 text-green-500" />
                      <Badge className={getRankBadgeClass(resumen.rango_actual)} variant="secondary">
                        {resumen.rango_actual}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">País</p>
              <p className="text-xl font-bold">
                {resumen.country_code === 'MX' ? '🇲🇽 Mexico' : '🇺🇸 USA'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de puntos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <UserPlus className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-blue-600">{formatNumber(resumen.parte1.total_puntos)}</p>
            <p className="text-sm text-muted-foreground">Parte 1: Patrocinios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Medal className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <p className="text-3xl font-bold text-amber-600">{formatNumber(resumen.parte2.total_puntos)}</p>
            <p className="text-sm text-muted-foreground">Parte 2: Rango</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-3xl font-bold text-green-600">{formatNumber(resumen.parte3.total_puntos)}</p>
            <p className="text-sm text-muted-foreground">Parte 3: Equipo</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 text-center">
            <Trophy className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold text-primary">{formatNumber(resumen.puntos_total)}</p>
            <p className="text-sm text-muted-foreground font-medium">TOTAL</p>
          </CardContent>
        </Card>
      </div>

      {/* Parte 1: Patrocinios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-500" />
            Parte 1: Nuevos Patrocinios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{resumen.parte1.nuevos_patrocinados}</p>
              <p className="text-sm text-muted-foreground">Nuevos Patrocinados</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{resumen.parte1.patrocinios_200}</p>
              <p className="text-sm text-muted-foreground">3+ productos (200 pts)</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{resumen.parte1.patrocinios_300}</p>
              <p className="text-sm text-muted-foreground">5+ productos (300 pts)</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">{resumen.parte1.seguimientos}</p>
              <p className="text-sm text-muted-foreground">Seguimientos (150 pts)</p>
            </div>
          </div>

          {loadingPatrocinios ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : patrocinios && patrocinios.detalle.length > 0 ? (
            <div className="space-y-2">
              {patrocinios.detalle.map((p) => (
                <PatrocinioDetalleCard key={p.id_customers} patrocinado={p} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay patrocinados nuevos en el periodo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Parte 2: Rango Personal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Medal className="h-6 w-6 text-amber-500" />
            Parte 2: Rango Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                {resumen.parte2.mantuvo_rango ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className="font-semibold text-lg">Mantuvo Rango</span>
              </div>
              <p className="text-3xl font-bold">{formatNumber(resumen.parte2.puntos_mantener)} pts</p>
              <p className="text-sm text-muted-foreground mt-2">
                {resumen.parte2.mantuvo_rango
                  ? `Mantuvo ${resumen.rango_inicial} durante todo el periodo`
                  : 'No mantuvo el rango en todos los periodos'}
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                {resumen.parte2.subio_rango ? (
                  <ArrowUp className="h-6 w-6 text-green-500" />
                ) : (
                  <span className="h-6 w-6" />
                )}
                <span className="font-semibold text-lg">Subio de Rango</span>
              </div>
              <p className="text-3xl font-bold">{formatNumber(resumen.parte2.puntos_subir)} pts</p>
              <p className="text-sm text-muted-foreground mt-2">
                {resumen.parte2.subio_rango
                  ? `Subio a ${resumen.parte2.rango_subido}`
                  : 'No subio de rango'}
              </p>
            </div>
          </div>

          {/* Gráfica de historial de rangos */}
          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium text-muted-foreground mb-4">Historial de Rangos por Periodo</p>
            {loadingRangos ? (
              <Skeleton className="h-32 w-full" />
            ) : rangos && rangos.historial.length > 0 ? (
              <RangoHistorialChart
                historial={rangos.historial}
                rangoInicial={resumen.rango_inicial}
              />
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay historial de rangos disponible
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parte 3: Crecimiento del Equipo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Parte 3: Crecimiento del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <Badge className={getRankBadgeClass('Bronce')} variant="secondary">Bronce</Badge>
              <p className="text-2xl font-bold mt-2">{resumen.parte3.nuevos_bronces}</p>
              <p className="text-sm text-muted-foreground">{formatNumber(resumen.parte3.nuevos_bronces * 500)} pts</p>
              {resumen.parte3.nuevos_bronces >= 3 && (
                <Badge variant="default" className="mt-2 bg-green-500">+1,000 bonus</Badge>
              )}
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Badge className={getRankBadgeClass('Plata')} variant="secondary">Plata</Badge>
              <p className="text-2xl font-bold mt-2">{resumen.parte3.nuevos_platas}</p>
              <p className="text-sm text-muted-foreground">{formatNumber(resumen.parte3.nuevos_platas * 700)} pts</p>
              {resumen.parte3.nuevos_platas >= 3 && (
                <Badge variant="default" className="mt-2 bg-green-500">+1,500 bonus</Badge>
              )}
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Badge className={getRankBadgeClass('Oro')} variant="secondary">Oro</Badge>
              <p className="text-2xl font-bold mt-2">{resumen.parte3.nuevos_oros}</p>
              <p className="text-sm text-muted-foreground">{formatNumber(resumen.parte3.nuevos_oros * 1500)} pts</p>
              {resumen.parte3.nuevos_oros >= 3 && (
                <Badge variant="default" className="mt-2 bg-green-500">+2,000 bonus</Badge>
              )}
            </div>
          </div>

          {/* Mostrar desglose si hay bonus */}
          {(resumen.parte3.bonus_bronces > 0 || resumen.parte3.bonus_platas > 0 || resumen.parte3.bonus_oros > 0) && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Bonificaciones por lograr 3+:</p>
              <div className="flex gap-4 text-sm">
                {resumen.parte3.bonus_bronces > 0 && (
                  <span className="text-green-700">3 Bronces: +{formatNumber(resumen.parte3.bonus_bronces)}</span>
                )}
                {resumen.parte3.bonus_platas > 0 && (
                  <span className="text-green-700">3 Platas: +{formatNumber(resumen.parte3.bonus_platas)}</span>
                )}
                {resumen.parte3.bonus_oros > 0 && (
                  <span className="text-green-700">3 Oros: +{formatNumber(resumen.parte3.bonus_oros)}</span>
                )}
              </div>
            </div>
          )}

          {loadingEquipo ? (
            <Skeleton className="h-32 w-full" />
          ) : equipo && equipo.detalle.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead className="text-center">Abril</TableHead>
                  <TableHead className="text-center">Mayo</TableHead>
                  <TableHead className="text-center">Junio</TableHead>
                  <TableHead className="text-center">Agosto</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipo.detalle.map((e) => {
                  // Detectar en qué período subió de rango
                  const rangos = [e.rango_abril, e.rango_mayo, e.rango_junio, e.rango_agosto];
                  const nivelAbril = JERARQUIA_RANGOS[e.rango_abril] || 1;

                  return (
                    <TableRow key={e.id_customers}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{e.full_name}</p>
                          <p className="text-xs text-muted-foreground">ID: {e.id_customers}</p>
                        </div>
                      </TableCell>
                      {rangos.map((rango, idx) => {
                        const nivelActual = JERARQUIA_RANGOS[rango] || 1;
                        const nivelAnterior = idx === 0 ? nivelAbril : JERARQUIA_RANGOS[rangos[idx - 1]] || 1;
                        const subioEstePerodo = nivelActual > nivelAnterior;

                        return (
                          <TableCell key={idx} className="text-center">
                            <Badge className={getRankBadgeClass(rango)} variant="secondary">
                              {rango}
                            </Badge>
                            {subioEstePerodo && (
                              <ArrowUp className="inline h-3 w-3 ml-1 text-green-500" />
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right font-bold text-green-600">+{formatNumber(e.puntos)}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Fila de total */}
                <TableRow className="bg-muted/50 border-t-2">
                  <TableCell colSpan={5} className="text-right font-semibold">
                    Total Puntos Equipo:
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600 text-lg">
                    +{formatNumber(equipo.detalle.reduce((sum, e) => sum + e.puntos, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay crecimiento de equipo registrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para mostrar el detalle de un patrocinado con sus compras
function PatrocinioDetalleCard({ patrocinado }: { patrocinado: PatrocinioDetalle }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
              <div>
                <p className="font-semibold">{patrocinado.full_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Registro: {patrocinado.date_registration}
                  <span className="mx-2">|</span>
                  ID: {patrocinado.id_customers}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">1ra Compra</p>
                <p className="font-medium">
                  {patrocinado.primera_compra_productos} prod.
                  {patrocinado.puntos_primera_compra > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                      +{patrocinado.puntos_primera_compra}
                    </Badge>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Recompras 5+</p>
                <p className="font-medium">
                  {patrocinado.recompras_5_plus}
                  {patrocinado.puntos_seguimiento > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                      +{patrocinado.puntos_seguimiento}
                    </Badge>
                  )}
                </p>
              </div>
              <div className="text-right min-w-[100px]">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">{formatNumber(patrocinado.puntos_total)}</p>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t bg-white p-4">
            {patrocinado.compras && patrocinado.compras.length > 0 ? (
              <div className="space-y-4">
                {patrocinado.compras.map((compra) => (
                  <CompraDetalleCard key={compra.id_document} compra={compra} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-2">
                No hay compras registradas
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Componente para mostrar el detalle de una compra
function CompraDetalleCard({ compra }: { compra: CompraDetalle }) {
  return (
    <div className={`border rounded-lg p-4 ${compra.es_primera_compra ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className={`h-5 w-5 ${compra.es_primera_compra ? 'text-blue-500' : 'text-gray-500'}`} />
          <span className="font-semibold">
            {compra.es_primera_compra ? '1ra Compra' : `Recompra #${compra.numero_compra}`}
          </span>
          <span className="text-sm text-muted-foreground">
            (Doc: {compra.id_document})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{compra.fecha}</span>
          <Badge variant={compra.puntos_otorgados > 0 ? 'default' : 'secondary'}>
            {compra.cantidad_productos} productos {compra.puntos_otorgados > 0 && `= +${compra.puntos_otorgados} pts campamento`}
          </Badge>
          {compra.total_puntos_productos > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {formatNumber(compra.total_puntos_productos)} pts producto
            </Badge>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="py-2">Producto</TableHead>
            <TableHead className="py-2 text-center w-20">Cant.</TableHead>
            <TableHead className="py-2 text-right w-28">Pts Unit.</TableHead>
            <TableHead className="py-2 text-right w-28">Pts Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {compra.productos.map((producto, idx) => {
            const noContable = producto.puntos_unitarios === 0;
            return (
              <TableRow key={idx} className={noContable ? 'opacity-50' : ''}>
                <TableCell className="py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className={`h-4 w-4 ${noContable ? 'text-red-400' : 'text-green-500'}`} />
                    {producto.name_product}
                    {noContable && <span className="text-xs text-red-500">(No cuenta)</span>}
                  </div>
                </TableCell>
                <TableCell className="py-2 text-center text-sm">{producto.quantity}</TableCell>
                <TableCell className="py-2 text-right text-sm text-muted-foreground">
                  {producto.puntos_unitarios > 0 ? formatNumber(producto.puntos_unitarios) : '-'}
                </TableCell>
                <TableCell className="py-2 text-right text-sm font-medium">
                  {producto.puntos_total > 0 ? formatNumber(producto.puntos_total) : '-'}
                </TableCell>
              </TableRow>
            );
          })}
          {compra.total_puntos_productos > 0 && (
            <TableRow className="border-t font-medium bg-muted/30">
              <TableCell colSpan={3} className="py-2 text-sm text-right">
                Total Puntos Producto:
              </TableCell>
              <TableCell className="py-2 text-right text-sm text-green-600 font-bold">
                {formatNumber(compra.total_puntos_productos)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Jerarquía de rangos para calcular altura de barras
const JERARQUIA_RANGOS: Record<string, number> = {
  'Distribuidor': 1,
  'Bronce': 2,
  'Plata': 3,
  'Oro': 4,
  'Platino': 5,
  'Diamante': 6,
  'Doble Diamante': 7,
  'Triple Diamante': 8,
  'Diamante Sirius': 9,
  'Azul': 10,
};

// Componente de gráfica de historial de rangos
function RangoHistorialChart({ historial, rangoInicial }: { historial: RangoHistorial[]; rangoInicial: string }) {
  const nivelInicial = JERARQUIA_RANGOS[rangoInicial] || 1;
  const maxNivel = Math.max(...historial.map(h => JERARQUIA_RANGOS[h.rango] || 1), nivelInicial);

  // Calcular altura proporcional (mínimo 20%, máximo 100%)
  const getBarHeight = (rango: string) => {
    const nivel = JERARQUIA_RANGOS[rango] || 1;
    return Math.max(20, (nivel / maxNivel) * 100);
  };

  // Verificar si el rango bajó respecto al inicial
  const isBelowInitial = (rango: string) => {
    const nivel = JERARQUIA_RANGOS[rango] || 1;
    return nivel < nivelInicial;
  };

  // Verificar si el rango subió respecto al inicial
  const isAboveInitial = (rango: string) => {
    const nivel = JERARQUIA_RANGOS[rango] || 1;
    return nivel > nivelInicial;
  };

  return (
    <div className="space-y-4">
      {/* Gráfica de barras */}
      <div className="flex items-end justify-around gap-2 h-40 px-4">
        {historial.map((h) => {
          const belowInitial = isBelowInitial(h.rango);
          const aboveInitial = isAboveInitial(h.rango);

          return (
            <div key={h.id_period} className="flex flex-col items-center flex-1 max-w-[120px]">
              <div className="relative w-full flex flex-col items-center">
                {/* Badge del rango */}
                <Badge
                  className={`${getRankBadgeClass(h.rango)} text-xs mb-2 whitespace-nowrap`}
                  variant="secondary"
                >
                  {h.rango}
                </Badge>

                {/* Barra */}
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    belowInitial
                      ? 'bg-red-400'
                      : aboveInitial
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ height: `${getBarHeight(h.rango)}px` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels de período */}
      <div className="flex justify-around gap-2 px-4">
        {historial.map((h) => (
          <div key={h.id_period} className="flex-1 max-w-[120px] text-center">
            <p className="text-xs font-medium text-muted-foreground">{h.name_period}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(h.puntos_personales)} pts</p>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex justify-center gap-6 pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-xs text-muted-foreground">Mantuvo rango</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-xs text-muted-foreground">Subió de rango</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-xs text-muted-foreground">Bajó de rango</span>
        </div>
      </div>
    </div>
  );
}
