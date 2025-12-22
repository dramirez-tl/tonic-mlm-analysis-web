'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getNetworkTree,
  getNetworkFirstLevel,
  getNetworkStatsByLevel,
  type NetworkNode,
} from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { Network, Users, BarChart3, ZoomIn, ZoomOut, RotateCcw, Loader2, Eye } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';

interface NetworkPanelProps {
  distributorId: number;
  periodId: number;
}

// Plan colors for tree visualization
const PLAN_COLORS: Record<string, string> = {
  'Oro': '#fbbf24',
  'Plata': '#9ca3af',
  'Bronce': '#b45309',
  'Diamante': '#60a5fa',
  'Esmeralda': '#34d399',
  'Rubí': '#f87171',
  'Zafiro': '#818cf8',
  'default': '#6b7280',
};

function getNodeColor(plan: string): string {
  for (const [key, color] of Object.entries(PLAN_COLORS)) {
    if (plan.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return PLAN_COLORS.default;
}

export function NetworkPanel({ distributorId, periodId }: NetworkPanelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [depth, setDepth] = useState(3);
  const [shouldLoad, setShouldLoad] = useState(false);

  const { data: tree, isLoading: loadingTree, isFetching: fetchingTree } = useQuery({
    queryKey: ['network-tree', distributorId, periodId, depth],
    queryFn: () => getNetworkTree(distributorId, periodId, depth),
    enabled: shouldLoad && !isNaN(distributorId) && !isNaN(periodId),
  });

  const { data: frontals, isLoading: loadingFrontals, isFetching: fetchingFrontals } = useQuery({
    queryKey: ['network-frontals', distributorId, periodId],
    queryFn: () => getNetworkFirstLevel(distributorId, periodId),
    enabled: shouldLoad && !isNaN(distributorId) && !isNaN(periodId),
  });

  const { data: levelStats, isLoading: loadingStats, isFetching: fetchingStats } = useQuery({
    queryKey: ['network-stats', distributorId, periodId],
    queryFn: () => getNetworkStatsByLevel(distributorId, periodId),
    enabled: shouldLoad && !isNaN(distributorId) && !isNaN(periodId),
  });

  const isLoading = loadingTree || loadingFrontals || loadingStats;
  const isFetching = fetchingTree || fetchingFrontals || fetchingStats;

  // D3 Tree Visualization
  useEffect(() => {
    if (!tree || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 500;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create zoomable group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tree layout
    const treeLayout = d3.tree<NetworkNode>()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right - 200]);

    // Create hierarchy
    const root = d3.hierarchy(tree);
    const treeData = treeLayout(root);

    // Draw links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1.5)
      .attr('d', d3.linkHorizontal<d3.HierarchyPointLink<NetworkNode>, d3.HierarchyPointNode<NetworkNode>>()
        .x(d => d.y)
        .y(d => d.x)
      );

    // Create node groups
    const nodes = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`);

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', 8)
      .attr('fill', d => getNodeColor(d.data.plan))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add name labels
    nodes.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.children ? -12 : 12)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => {
        const name = d.data.name;
        return name.length > 20 ? name.substring(0, 17) + '...' : name;
      })
      .attr('font-size', '11px')
      .attr('fill', '#374151');

    // Add points labels
    nodes.append('text')
      .attr('dy', '1.5em')
      .attr('x', d => d.children ? -12 : 12)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => `${formatNumber(d.data.points)} pts`)
      .attr('font-size', '9px')
      .attr('fill', '#9ca3af');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Store zoom for controls
    zoomRef.current = zoom;

  }, [tree]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomRef.current.transform, d3.zoomIdentity.translate(120, 20));
  };

  const handleLoadNetwork = () => {
    setShouldLoad(true);
  };

  const totalNetwork = levelStats?.reduce((acc, s) => acc + s.count, 0) || 0;
  const totalPoints = levelStats?.reduce((acc, s) => acc + s.total_points, 0) || 0;

  // Estado inicial: mostrar botón para cargar
  if (!shouldLoad) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="p-4 rounded-full bg-blue-50">
              <Network className="h-16 w-16 text-blue-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800">Visualización de Red</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                La carga de la estructura de red puede tomar varios segundos dependiendo del tamaño de la red.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleLoadNetwork}
              className="gap-2"
            >
              <Eye className="h-5 w-5" />
              Cargar Red
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado de carga
  if (isLoading || isFetching) {
    return (
      <Card className="border-2 border-blue-200">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">Cargando estructura de red...</p>
              <p className="text-sm text-gray-500 mt-1">
                Obteniendo árbol, frontales y estadísticas por nivel
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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 flex items-center">
              Total en Red
              <InfoTooltip content="Número total de distribuidores en toda tu estructura, sumando todos los niveles de profundidad." />
            </p>
            <p className="text-2xl font-bold">{formatNumber(totalNetwork)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 flex items-center">
              Frontales Directos
              <InfoTooltip content="Distribuidores patrocinados directamente por ti, ubicados en el primer nivel de tu red." />
            </p>
            <p className="text-2xl font-bold">{formatNumber(frontals?.length || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 flex items-center">
              Puntos Totales Red
              <InfoTooltip content="Suma de todos los puntos generados por los distribuidores en tu red en el período actual." />
            </p>
            <p className="text-2xl font-bold">{formatNumber(totalPoints)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-500 flex items-center">
              Niveles de Profundidad
              <InfoTooltip content="Cuántos niveles de profundidad tiene tu red desde ti hasta el distribuidor más lejano." />
            </p>
            <p className="text-2xl font-bold">{levelStats?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree" className="gap-2">
            <Network className="h-4 w-4" />
            Árbol Visual
          </TabsTrigger>
          <TabsTrigger value="frontals" className="gap-2">
            <Users className="h-4 w-4" />
            Frontales
          </TabsTrigger>
          <TabsTrigger value="levels" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Por Nivel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Árbol de Red
                  </CardTitle>
                  <CardDescription>
                    Visualización jerárquica de la red (mostrando {depth} niveles)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetZoom}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(Number(e.target.value))}
                    className="h-9 rounded-md border border-gray-200 px-3 text-sm"
                  >
                    <option value={2}>2 niveles</option>
                    <option value={3}>3 niveles</option>
                    <option value={4}>4 niveles</option>
                    <option value={5}>5 niveles</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={containerRef} className="w-full overflow-hidden border rounded-lg bg-gray-50">
                {fetchingTree ? (
                  <div className="h-[500px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : tree ? (
                  <svg ref={svgRef} className="w-full" style={{ minHeight: '500px' }} />
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-gray-500">
                    No hay datos de red disponibles
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="text-gray-500">Planes:</span>
                {Object.entries(PLAN_COLORS).filter(([k]) => k !== 'default').map(([plan, color]) => (
                  <div key={plan} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span>{plan}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frontals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Frontales Directos
              </CardTitle>
              <CardDescription>
                Resumen de cada frontal y su subred
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fetchingFrontals ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-right">Pts Personales</TableHead>
                      <TableHead className="text-right">Tamaño Subred</TableHead>
                      <TableHead className="text-right">Pts Subred</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {frontals?.map((frontal) => (
                      <TableRow key={frontal.id}>
                        <TableCell className="font-mono text-sm">{frontal.id}</TableCell>
                        <TableCell>{frontal.name}</TableCell>
                        <TableCell>
                          <Badge
                            style={{ backgroundColor: getNodeColor(frontal.plan), color: '#fff' }}
                          >
                            {frontal.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(frontal.personal_points)}</TableCell>
                        <TableCell className="text-right">{formatNumber(frontal.subnet_size)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(frontal.subnet_points)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribución por Nivel
              </CardTitle>
              <CardDescription>
                Cantidad de distribuidores y puntos por cada nivel de profundidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fetchingStats ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Visual Chart */}
                  <div className="mb-6 space-y-2">
                    {levelStats?.map((stat) => {
                      const countPercentage = totalNetwork > 0 ? (stat.count / totalNetwork) * 100 : 0;
                      return (
                        <div key={stat.nivel} className="flex items-center gap-4">
                          <span className="w-16 text-sm font-medium">Nivel {stat.nivel}</span>
                          <div className="flex-1 h-8 bg-gray-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-blue-500 flex items-center px-2"
                              style={{ width: `${Math.max(countPercentage, 2)}%` }}
                            >
                              {countPercentage > 10 && (
                                <span className="text-xs text-white font-medium">
                                  {formatNumber(stat.count)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="w-20 text-right text-sm">
                            {formatNumber(stat.count)} dist.
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nivel</TableHead>
                        <TableHead className="text-right">Distribuidores</TableHead>
                        <TableHead className="text-right">% del Total</TableHead>
                        <TableHead className="text-right">Puntos Totales</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {levelStats?.map((stat) => (
                        <TableRow key={stat.nivel}>
                          <TableCell className="font-medium">Nivel {stat.nivel}</TableCell>
                          <TableCell className="text-right">{formatNumber(stat.count)}</TableCell>
                          <TableCell className="text-right">
                            {totalNetwork > 0 ? ((stat.count / totalNetwork) * 100).toFixed(1) : 0}%
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(stat.total_points)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatNumber(totalNetwork)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                        <TableCell className="text-right">{formatNumber(totalPoints)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
