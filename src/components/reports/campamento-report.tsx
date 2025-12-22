'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getCampamentoRankingMexico,
  getCampamentoRankingUSA,
  getCampamentoResumen,
  getCampamentoPatrocinios,
  getCampamentoEquipo,
  CampamentoParticipante,
  CampamentoResumen,
  PatrocinioDetalle,
  CompraDetalle,
} from '@/lib/api';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Trophy,
  Users,
  TrendingUp,
  UserPlus,
  Medal,
  ChevronRight,
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

export function CampamentoReport() {
  const [activeTab, setActiveTab] = useState<'mexico' | 'usa'>('mexico');
  const [selectedLider, setSelectedLider] = useState<number | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch ranking Mexico
  const { data: rankingMexico, isLoading: loadingMexico } = useQuery({
    queryKey: ['campamentoRankingMexico'],
    queryFn: getCampamentoRankingMexico,
  });

  // Fetch ranking USA
  const { data: rankingUSA, isLoading: loadingUSA } = useQuery({
    queryKey: ['campamentoRankingUSA'],
    queryFn: getCampamentoRankingUSA,
    enabled: activeTab === 'usa',
  });

  // Fetch detalle del lider seleccionado
  const { data: resumenLider, isLoading: loadingResumen } = useQuery({
    queryKey: ['campamentoResumen', selectedLider],
    queryFn: () => getCampamentoResumen(selectedLider!),
    enabled: !!selectedLider && showDetailDialog,
  });

  const { data: patrociniosLider } = useQuery({
    queryKey: ['campamentoPatrocinios', selectedLider],
    queryFn: () => getCampamentoPatrocinios(selectedLider!),
    enabled: !!selectedLider && showDetailDialog,
  });

  const { data: equipoLider } = useQuery({
    queryKey: ['campamentoEquipo', selectedLider],
    queryFn: () => getCampamentoEquipo(selectedLider!),
    enabled: !!selectedLider && showDetailDialog,
  });

  const currentRanking = activeTab === 'mexico' ? rankingMexico : rankingUSA;
  const isLoading = activeTab === 'mexico' ? loadingMexico : loadingUSA;

  const handleVerDetalle = (idLider: number) => {
    setSelectedLider(idLider);
    setShowDetailDialog(true);
  };

  // Export to CSV
  const exportToCSV = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* Info del campamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Campamento</p>
                <p className="text-lg font-bold text-blue-900">Lideres 2026</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Periodo</p>
                <p className="text-lg font-bold text-green-900">Mar - Ago 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Medal className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-600 font-medium">Cupos</p>
                <p className="text-lg font-bold text-amber-900">MX: 50 | USA: 25</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Mexico / USA */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mexico' | 'usa')}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-64 grid-cols-2">
            <TabsTrigger value="mexico" className="flex items-center gap-2">
              <span className="text-lg">🇲🇽</span> Mexico
            </TabsTrigger>
            <TabsTrigger value="usa" className="flex items-center gap-2">
              <span className="text-lg">🇺🇸</span> USA
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!currentRanking}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <TabsContent value="mexico" className="mt-4">
          <RankingTable
            ranking={rankingMexico?.ranking || []}
            isLoading={loadingMexico}
            cupos={50}
            rangoMinimo="Oro"
            onVerDetalle={handleVerDetalle}
          />
        </TabsContent>

        <TabsContent value="usa" className="mt-4">
          <RankingTable
            ranking={rankingUSA?.ranking || []}
            isLoading={loadingUSA}
            cupos={25}
            rangoMinimo="Plata"
            onVerDetalle={handleVerDetalle}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] max-w-[1600px] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Detalle de Puntos - {resumenLider?.full_name}
            </DialogTitle>
          </DialogHeader>

          {loadingResumen ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : resumenLider ? (
            <LiderDetalleContent
              resumen={resumenLider}
              patrocinios={patrociniosLider}
              equipo={equipoLider}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de tabla de ranking
interface RankingTableProps {
  ranking: CampamentoParticipante[];
  isLoading: boolean;
  cupos: number;
  rangoMinimo: string;
  onVerDetalle: (id: number) => void;
}

function RankingTable({ ranking, isLoading, cupos, rangoMinimo, onVerDetalle }: RankingTableProps) {
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
                  className={idx < cupos ? 'bg-green-50/50' : 'bg-red-50/30'}
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
}

// Componente de detalle del lider
interface LiderDetalleContentProps {
  resumen: CampamentoResumen;
  patrocinios?: {
    total_patrocinados: number;
    patrocinios_200: number;
    patrocinios_300: number;
    seguimientos: number;
    puntos_total: number;
    detalle: PatrocinioDetalle[];
  };
  equipo?: {
    total_crecimiento: number;
    nuevos_bronces: number;
    nuevos_platas: number;
    nuevos_oros: number;
    puntos_total: number;
    detalle: Array<{
      id_customers: number;
      full_name: string;
      rango_abril: string;
      rango_agosto: string;
      tipo_crecimiento: string;
      puntos: number;
    }>;
  };
}

function LiderDetalleContent({ resumen, patrocinios, equipo }: LiderDetalleContentProps) {
  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="col-span-1">
          <CardContent className="pt-4 text-center">
            <UserPlus className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-600">{formatNumber(resumen.parte1.total_puntos)}</p>
            <p className="text-xs text-muted-foreground">Parte 1: Patrocinios</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 text-center">
            <Medal className="h-6 w-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-amber-600">{formatNumber(resumen.parte2.total_puntos)}</p>
            <p className="text-xs text-muted-foreground">Parte 2: Rango</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{formatNumber(resumen.parte3.total_puntos)}</p>
            <p className="text-xs text-muted-foreground">Parte 3: Equipo</p>
          </CardContent>
        </Card>
        <Card className="col-span-1 bg-primary/5">
          <CardContent className="pt-4 text-center">
            <Trophy className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold text-primary">{formatNumber(resumen.puntos_total)}</p>
            <p className="text-xs text-muted-foreground">TOTAL</p>
          </CardContent>
        </Card>
      </div>

      {/* Parte 1: Patrocinios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Parte 1: Nuevos Patrocinios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xl font-bold">{resumen.parte1.nuevos_patrocinados}</p>
              <p className="text-xs text-muted-foreground">Nuevos</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-600">{resumen.parte1.patrocinios_200}</p>
              <p className="text-xs text-muted-foreground">3+ productos (200 pts)</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{resumen.parte1.patrocinios_300}</p>
              <p className="text-xs text-muted-foreground">5+ productos (300 pts)</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-xl font-bold text-amber-600">{resumen.parte1.seguimientos}</p>
              <p className="text-xs text-muted-foreground">Seguimientos (150 pts)</p>
            </div>
          </div>

          {patrocinios && patrocinios.detalle.length > 0 && (
            <div className="space-y-2">
              {patrocinios.detalle.map((p) => (
                <PatrocinioDetalleCard key={p.id_customers} patrocinado={p} />
              ))}
            </div>
          )}

          {patrocinios && patrocinios.detalle.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No hay patrocinados nuevos en el periodo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Parte 2: Rango Personal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Medal className="h-5 w-5 text-amber-500" />
            Parte 2: Rango Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {resumen.parte2.mantuvo_rango ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Mantuvo Rango</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(resumen.parte2.puntos_mantener)} pts</p>
              <p className="text-sm text-muted-foreground">
                {resumen.parte2.mantuvo_rango
                  ? `${resumen.rango_inicial} durante todo el periodo`
                  : 'No mantuvo el rango en todos los periodos'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {resumen.parte2.subio_rango ? (
                  <ArrowUp className="h-5 w-5 text-green-500" />
                ) : (
                  <span className="h-5 w-5" />
                )}
                <span className="font-medium">Subio de Rango</span>
              </div>
              <p className="text-2xl font-bold">{formatNumber(resumen.parte2.puntos_subir)} pts</p>
              <p className="text-sm text-muted-foreground">
                {resumen.parte2.subio_rango
                  ? `Subio a ${resumen.parte2.rango_subido}`
                  : 'No subio de rango'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parte 3: Crecimiento del Equipo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Parte 3: Crecimiento del Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <Badge className={getRankBadgeClass('Bronce')} variant="secondary">Bronce</Badge>
              <p className="text-xl font-bold mt-2">{resumen.parte3.nuevos_bronces}</p>
              <p className="text-xs text-muted-foreground">{resumen.parte3.nuevos_bronces * 500} pts</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Badge className={getRankBadgeClass('Plata')} variant="secondary">Plata</Badge>
              <p className="text-xl font-bold mt-2">{resumen.parte3.nuevos_platas}</p>
              <p className="text-xs text-muted-foreground">{resumen.parte3.nuevos_platas * 700} pts</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Badge className={getRankBadgeClass('Oro')} variant="secondary">Oro</Badge>
              <p className="text-xl font-bold mt-2">{resumen.parte3.nuevos_oros}</p>
              <p className="text-xs text-muted-foreground">{resumen.parte3.nuevos_oros * 1500} pts</p>
            </div>
          </div>

          {equipo && equipo.detalle.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead className="text-center">Rango Abril</TableHead>
                  <TableHead className="text-center">Rango Agosto</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipo.detalle.map((e) => (
                  <TableRow key={e.id_customers}>
                    <TableCell>{e.full_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getRankBadgeClass(e.rango_abril)} variant="secondary">
                        {e.rango_abril}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getRankBadgeClass(e.rango_agosto)} variant="secondary">
                        {e.rango_agosto}
                      </Badge>
                      <ArrowUp className="inline h-3 w-3 ml-1 text-green-500" />
                    </TableCell>
                    <TableCell className="text-right font-bold">+{formatNumber(e.puntos)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
          <div className="flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
              <div>
                <p className="font-medium">{patrocinado.full_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Registro: {patrocinado.date_registration}
                  <span className="mx-2">|</span>
                  ID: {patrocinado.id_customers}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
              <div className="text-right min-w-[80px]">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">{formatNumber(patrocinado.puntos_total)}</p>
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
    <div className={`border rounded-lg p-3 ${compra.es_primera_compra ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className={`h-4 w-4 ${compra.es_primera_compra ? 'text-blue-500' : 'text-gray-500'}`} />
          <span className="font-medium">
            {compra.es_primera_compra ? '1ra Compra' : `Recompra #${compra.numero_compra}`}
          </span>
          <span className="text-xs text-muted-foreground">
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

      <div className="pl-6">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-1">Producto</TableHead>
              <TableHead className="py-1 text-center w-16">Cant.</TableHead>
              <TableHead className="py-1 text-right w-24">Pts Unit.</TableHead>
              <TableHead className="py-1 text-right w-24">Pts Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compra.productos.map((producto, idx) => {
              const esKit = producto.name_product.includes('(KIT - No cuenta)');
              return (
                <TableRow key={idx} className={esKit ? 'opacity-50' : ''}>
                  <TableCell className="py-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className={`h-3 w-3 ${esKit ? 'text-red-400' : 'text-green-500'}`} />
                      {producto.name_product}
                    </div>
                  </TableCell>
                  <TableCell className="py-1 text-center text-sm">{producto.quantity}</TableCell>
                  <TableCell className="py-1 text-right text-sm text-muted-foreground">
                    {producto.puntos_unitarios > 0 ? formatNumber(producto.puntos_unitarios) : '-'}
                  </TableCell>
                  <TableCell className="py-1 text-right text-sm font-medium">
                    {producto.puntos_total > 0 ? formatNumber(producto.puntos_total) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
            {compra.total_puntos_productos > 0 && (
              <TableRow className="border-t font-medium bg-muted/30">
                <TableCell colSpan={3} className="py-1 text-sm text-right">
                  Total Puntos Producto:
                </TableCell>
                <TableCell className="py-1 text-right text-sm text-green-600 font-bold">
                  {formatNumber(compra.total_puntos_productos)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
