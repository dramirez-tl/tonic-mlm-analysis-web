const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
export interface Distributor {
  id_customers: number;
  full_name: string;
  id_sponsor: number | null;
  sponsor_name: string | null;
  date_register: string;
  id_plan: number;
  name_plan: string;
}

export interface Period {
  id_period: number;
  name_period: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export interface DistributorSummary {
  distributor: {
    id_customers: number;
    full_name: string;
    name_plan: string;
    id_country?: number;
    date_registration?: string;
    kit_type?: string;
  };
  currency: CurrencyInfo;
  period: {
    id_period: number;
    name_period: string;
  };
  personal: {
    point_current_customers: number;
    subtotal_earnings: number;
  };
  network: {
    total_distributors: number;
    qualified_frontals: number;
  };
  commissions: {
    total: number;
    generation_summary: {
      g0_g2_percentage: number;
      g3_g4_percentage: number;
      g0_g2_commission: number;
      g3_g4_commission: number;
    };
  };
}

export interface GenerationBreakdown {
  generation: number;
  personas: number;
  pts_negocio: number;
  comision: number;
  porcentaje: number;
}

export interface LevelBreakdown {
  nivel: number;
  personas: number;
  pts_negocio: number;
  comision: number;
  porcentaje_nivel: number;
  porcentaje_generation: number;
}

export interface LevelGenerationBreakdown {
  nivel: number;
  generation: number;
  personas: number;
  pts_negocio: number;
  comision: number;
  porcentaje_nivel: number;
  porcentaje_generation: number;
}

export interface CommissionDetail {
  id_customers: number;
  full_name: string | null;
  nivel: number | null;
  generation: number | null;
  name_plan: string | null;
  point_current_customers: number;
  point_business_customers: number;
  percentage_nivel: number;
  percentage_generation: number;
  subtotal_earnings: number;
  code_money: string | null;
}

export interface CommissionHistory {
  id_period: number;
  name_period: string | null;
  name_plan: string | null;
  subtotal_earnings: number;
  total: number;
  code_money: string | null;
}

// API Functions
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
    throw new Error(error.error || `Error ${response.status}`);
  }

  return response.json();
}

// Distributors
export async function getDistributor(id: number): Promise<Distributor> {
  return fetchAPI<Distributor>(`/distributors/${id}`);
}

export async function getDistributorSummary(id: number, periodId: number): Promise<DistributorSummary> {
  return fetchAPI<DistributorSummary>(`/distributors/${id}/summary?period=${periodId}`);
}

// Periods
export async function getPeriods(): Promise<Period[]> {
  const response = await fetchAPI<Period[] | { periods: Period[] }>('/periods');
  // Handle both array response and { periods: [...] } response
  if (Array.isArray(response)) {
    return response;
  }
  return response.periods;
}

export async function getCurrentPeriod(): Promise<Period> {
  return fetchAPI<Period>('/periods/current');
}

export async function getPeriod(id: number): Promise<Period> {
  return fetchAPI<Period>(`/periods/${id}`);
}

// Commissions
export async function getCommissionsByGeneration(id: number, periodId: number): Promise<GenerationBreakdown[]> {
  const response = await fetchAPI<{ generations: GenerationBreakdown[] }>(
    `/commissions/${id}/by-generation?period=${periodId}`
  );
  return response.generations;
}

export async function getCommissionsByLevel(id: number, periodId: number): Promise<LevelBreakdown[]> {
  const response = await fetchAPI<{ levels: LevelBreakdown[] }>(
    `/commissions/${id}/by-level?period=${periodId}`
  );
  return response.levels;
}

export async function getCommissionsByLevelGeneration(
  id: number,
  periodId: number
): Promise<LevelGenerationBreakdown[]> {
  const response = await fetchAPI<{ data: LevelGenerationBreakdown[] }>(
    `/commissions/${id}/by-level-generation?period=${periodId}`
  );
  return response.data;
}

export interface CommissionDetailsResponse {
  data: CommissionDetail[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export async function getCommissionDetails(
  id: number,
  periodId: number,
  options?: { limit?: number; offset?: number; nivel?: number; generation?: number }
): Promise<CommissionDetailsResponse> {
  const params = new URLSearchParams({ period: periodId.toString() });

  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.nivel !== undefined) params.append('nivel', options.nivel.toString());
  if (options?.generation !== undefined) params.append('generation', options.generation.toString());

  return fetchAPI<CommissionDetailsResponse>(`/commissions/${id}/details?${params}`);
}

export async function getCommissionHistory(id: number, months = 12): Promise<CommissionHistory[]> {
  const response = await fetchAPI<{ history: CommissionHistory[] }>(
    `/commissions/${id}/history?months=${months}`
  );
  return response.history;
}

// Roll-Over Types
export interface RollOverConfig {
  v_grupal_required: number;
  rollover_percent: number;
  max_per_leg: number;
}

export interface RollOverSummary {
  distributor_rank: string;
  rollover_config: RollOverConfig;
  total_frontals: number;
  total_group_points: number;
  total_roll_over: number;
  effective_group_points: number;
  frontals_with_rollover: number;
  roll_over_percentage: number;
}

export interface RollOverLeg {
  id_customers: number;
  full_name: string;
  name_plan: string;
  points: number;
  personal_points: number;
  branch_points: number;
  nivel: number;
  roll_over: number;
  roll_over_applied: boolean;
  percentage_of_total: number;
  effective_points: number;
  effective_percentage: number;
  max_allowed: number;
  exceeds_limit: boolean;
}

export interface RollOverAnalysis {
  summary: RollOverSummary;
  legs: RollOverLeg[];
}

// Roll-Over API Functions
export async function getRollOverSummary(id: number, periodId: number): Promise<RollOverSummary> {
  return fetchAPI<RollOverSummary>(`/rollover/${id}/summary?period=${periodId}`);
}

export async function getRollOverAnalysis(id: number, periodId: number): Promise<RollOverAnalysis> {
  return fetchAPI<RollOverAnalysis>(`/rollover/${id}/analysis?period=${periodId}`);
}

// Network Types
export interface NetworkNode {
  id: number;
  name: string;
  plan: string;
  points: number;
  nivel: number;
  children?: NetworkNode[];
}

export interface NetworkFrontal {
  id: number;
  name: string;
  plan: string;
  personal_points: number;
  subnet_size: number;
  subnet_points: number;
}

export interface NetworkLevelStats {
  nivel: number;
  count: number;
  total_points: number;
}

// Network API Functions
export async function getNetworkTree(id: number, periodId: number, depth: number = 3): Promise<NetworkNode | null> {
  const response = await fetchAPI<{ tree: NetworkNode | null }>(
    `/network/${id}/tree?period=${periodId}&depth=${depth}`
  );
  return response.tree;
}

export async function getNetworkFirstLevel(id: number, periodId: number): Promise<NetworkFrontal[]> {
  const response = await fetchAPI<{ frontals: NetworkFrontal[] }>(
    `/network/${id}/first-level?period=${periodId}`
  );
  return response.frontals;
}

export async function getNetworkStatsByLevel(id: number, periodId: number): Promise<NetworkLevelStats[]> {
  const response = await fetchAPI<{ stats: NetworkLevelStats[] }>(
    `/network/${id}/stats-by-level?period=${periodId}`
  );
  return response.stats;
}

// Diagnostic Types
export interface DiagnosticResult {
  has_problem: boolean;
  problem_type: 'healthy' | 'moderate_dilution' | 'severe_dilution';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: {
    monetary: number;
    percentage: number;
  };
  recommendations: string[];
}

export interface PeriodData {
  id_period: number;
  name_period: string;
  total_commission: number;
  network_size: number;
  g0_g2_percentage: number;
  g3_g4_percentage: number;
  g0_g2_commission: number;
  g3_g4_commission: number;
}

export interface PeriodComparison {
  current_period: PeriodData;
  previous_period: PeriodData;
  changes: {
    commission_change: number;
    commission_change_percentage: number;
    network_change: number;
    network_change_percentage: number;
    g0_g2_shift: number;
    new_plata_plus_count: number;
  };
}

export interface FullDiagnostic {
  dilution: DiagnosticResult;
  comparison: PeriodComparison;
}

// Diagnostic API Functions
export async function getDilutionAnalysis(id: number, periodId: number): Promise<DiagnosticResult> {
  const response = await fetchAPI<{ analysis: DiagnosticResult }>(
    `/diagnostic/${id}/dilution?period=${periodId}`
  );
  return response.analysis;
}

export async function getPeriodComparison(id: number, periodId: number): Promise<PeriodComparison> {
  const response = await fetchAPI<{ comparison: PeriodComparison }>(
    `/diagnostic/${id}/comparison?period=${periodId}`
  );
  return response.comparison;
}

export async function getFullDiagnostic(id: number, periodId: number): Promise<FullDiagnostic> {
  return fetchAPI<FullDiagnostic>(`/diagnostic/${id}/full?period=${periodId}`);
}

// Simulator Types
export interface SimulationScenario {
  scenario_type: 'new_plata' | 'new_frontals' | 'volume_increase';
  description: string;
  input: Record<string, number | string>;
  impact: {
    title: string;
    details: string[];
    commission_change: number;
    is_positive: boolean;
  };
  breakdown: {
    positive_effects: Array<{ description: string; amount: number }>;
    negative_effects: Array<{ description: string; amount: number }>;
  };
}

export interface PlataCandidate {
  id_customers: number;
  full_name: string;
  nivel: number | null;
  generation: number | null;
  name_plan: string;
  points: number;
}

// Simulator API Functions
export async function simulateNewPlata(
  id: number,
  periodId: number,
  targetCustomerId: number
): Promise<SimulationScenario> {
  const response = await fetchAPI<{ simulation: SimulationScenario }>(
    `/simulator/${id}/new-plata?period=${periodId}&target=${targetCustomerId}`
  );
  return response.simulation;
}

export async function simulateNewFrontals(
  id: number,
  periodId: number,
  count: number = 3,
  points: number = 3300
): Promise<SimulationScenario> {
  const response = await fetchAPI<{ simulation: SimulationScenario }>(
    `/simulator/${id}/new-frontals?period=${periodId}&count=${count}&points=${points}`
  );
  return response.simulation;
}

export async function simulateVolumeIncrease(
  id: number,
  periodId: number,
  percentage: number = 10
): Promise<SimulationScenario> {
  const response = await fetchAPI<{ simulation: SimulationScenario }>(
    `/simulator/${id}/volume-increase?period=${periodId}&percentage=${percentage}`
  );
  return response.simulation;
}

export async function getPlataCandidates(id: number, periodId: number): Promise<PlataCandidate[]> {
  const response = await fetchAPI<{ candidates: PlataCandidate[] }>(
    `/simulator/${id}/candidates?period=${periodId}`
  );
  return response.candidates;
}

// Vertical Growth Analysis Types
export interface GenerationDistribution {
  generation: number;
  rate: number;
  count: number;
  total_points: number;
  total_commission: number;
  percentage_of_total: number;
}

export interface DilutionChainAffected {
  id_customers: number;
  full_name: string;
  name_plan: string;
  nivel: number;
  generation_before: number;
  generation_after: number;
  rate_before: number;
  rate_after: number;
  points: number;
  commission_lost: number;
}

export interface DilutionChain {
  chain_id: number;
  plata_distributor: {
    id_customers: number;
    full_name: string;
    name_plan: string;
    nivel: number;
  };
  affected_distributors: DilutionChainAffected[];
  total_commission_lost: number;
  affected_count: number;
}

export interface PlataDistributor {
  id_customers: number;
  full_name: string;
  name_plan: string;
  nivel: number;
  generation: number;
  points: number;
  commission: number;
  downline_in_g3_g4: number;
  estimated_dilution_caused: number;
}

export interface GenerationCutNode {
  id_customers: number;
  full_name: string;
  name_plan: string;
  nivel: number;
  generation: number;
  points: number;
  commission_earned: number;
  is_plata_plus: boolean;
  creates_generation_cut: boolean;
}

export interface VerticalGrowthAnalysis {
  summary: {
    total_plata_plus_in_network: number;
    total_dilution_amount: number;
    most_impacted_generation_shift: string;
    network_depth: number;
    average_generation: number;
    health_score: number;
  };
  generation_distribution: GenerationDistribution[];
  dilution_chains: DilutionChain[];
  plata_plus_distributors: PlataDistributor[];
  hypothetical_scenario: {
    current_commission: number;
    commission_if_no_platas: number;
    potential_gain: number;
    explanation: string;
  };
  visual_tree: GenerationCutNode[];
}

// Vertical Growth Analysis API Function
export async function getVerticalGrowthAnalysis(id: number, periodId: number): Promise<VerticalGrowthAnalysis> {
  return fetchAPI<VerticalGrowthAnalysis>(`/diagnostic/${id}/vertical-growth?period=${periodId}`);
}

// Reports Types
export interface NewRankSummary {
  period_id: number;
  period_name: string;
  rank_id: number;
  rank_name: string;
  count: number;
}

export interface NewRankByZone {
  period_id: number;
  period_name: string;
  branch_id: number;
  branch_name: string;
  country_code: string;
  rank_id: number;
  rank_name: string;
  count: number;
}

export interface NewRankDetail {
  id_customers: number;
  full_name: string;
  branch_id: number;
  branch_name: string;
  country_code: string;
  previous_rank_id: number;
  previous_rank_name: string;
  new_rank_id: number;
  new_rank_name: string;
  period_id: number;
  period_name: string;
}

// Reports API Functions
export async function getNewRanksYears(): Promise<number[]> {
  return fetchAPI<number[]>('/reports/new-ranks/years');
}

export async function getNewRanksSummary(year: number): Promise<NewRankSummary[]> {
  return fetchAPI<NewRankSummary[]>(`/reports/new-ranks/summary?year=${year}`);
}

export async function getNewRanksByZone(year: number): Promise<NewRankByZone[]> {
  return fetchAPI<NewRankByZone[]>(`/reports/new-ranks/by-zone?year=${year}`);
}

export async function getNewRanksDetail(year: number): Promise<NewRankDetail[]> {
  return fetchAPI<NewRankDetail[]>(`/reports/new-ranks/detail?year=${year}`);
}

// New Customers Report Types
export interface NewCustomersPeriod {
  id_period: number;
  name_period: string;
}

export interface NewCustomersSummary {
  period_id: number;
  period_name: string;
  kit_type: string;
  count: number;
}

export interface NewCustomersByZone {
  period_id: number;
  period_name: string;
  branch_id: number;
  branch_name: string;
  country_code: string;
  kit_type: string;
  count: number;
}

export interface NewCustomerDetail {
  id_customers: number;
  full_name: string;
  customer_type: string;
  date_registration: string;
  country_name: string;
  branch_name: string;
  kit_type: string;
  period_id: number;
  period_name: string;
}

// New Customers Report API Functions
export async function getNewCustomersPeriods(): Promise<NewCustomersPeriod[]> {
  return fetchAPI<NewCustomersPeriod[]>('/reports/new-customers/periods');
}

export async function getNewCustomersSummary(periodId: number): Promise<NewCustomersSummary[]> {
  return fetchAPI<NewCustomersSummary[]>(`/reports/new-customers/summary?period=${periodId}`);
}

export async function getNewCustomersByZone(periodId: number): Promise<NewCustomersByZone[]> {
  return fetchAPI<NewCustomersByZone[]>(`/reports/new-customers/by-zone?period=${periodId}`);
}

export async function getNewCustomersDetail(periodId: number): Promise<NewCustomerDetail[]> {
  return fetchAPI<NewCustomerDetail[]>(`/reports/new-customers/detail?period=${periodId}`);
}

// ==================== CAMPAMENTO DE LIDERES ====================

// Campamento Types
export interface CampamentoParticipante {
  id_customers: number;
  full_name: string;
  rango_inicial: string;
  rango_actual: string;
  country_code: string;
  puntos_parte1: number;
  puntos_parte2: number;
  puntos_parte3: number;
  puntos_total: number;
}

export interface CampamentoRanking {
  pais: string;
  rango_minimo: string;
  cupos: number;
  participantes: number;
  ranking: CampamentoParticipante[];
}

export interface CampamentoParte1 {
  total_puntos: number;
  nuevos_patrocinados: number;
  patrocinios_200: number;
  patrocinios_300: number;
  seguimientos: number;
}

export interface CampamentoParte2 {
  total_puntos: number;
  mantuvo_rango: boolean;
  puntos_mantener: number;
  subio_rango: boolean;
  rango_subido: string | null;
  puntos_subir: number;
}

export interface CampamentoParte3 {
  total_puntos: number;
  nuevos_bronces: number;
  nuevos_platas: number;
  nuevos_oros: number;
  bonus_bronces: number;
  bonus_platas: number;
  bonus_oros: number;
}

export interface CampamentoResumen {
  id_customers: number;
  full_name: string;
  rango_inicial: string;
  rango_actual: string;
  country_code: string;
  parte1: CampamentoParte1;
  parte2: CampamentoParte2;
  parte3: CampamentoParte3;
  puntos_total: number;
}

export interface CompraProducto {
  id_product: number;
  name_product: string;
  quantity: number;
  puntos_unitarios: number;
  puntos_total: number;
}

export interface CompraDetalle {
  id_document: number;
  fecha: string;
  numero_compra: number;
  cantidad_productos: number;
  es_primera_compra: boolean;
  puntos_otorgados: number;
  total_puntos_productos: number;
  productos: CompraProducto[];
}

export interface PatrocinioDetalle {
  id_customers: number;
  full_name: string;
  date_registration: string;
  primera_compra_productos: number;
  puntos_primera_compra: number;
  recompras_5_plus: number;
  puntos_seguimiento: number;
  puntos_total: number;
  compras: CompraDetalle[];
}

export interface CampamentoPatrocinios {
  id_lider: number;
  total_patrocinados: number;
  patrocinios_200: number;
  patrocinios_300: number;
  seguimientos: number;
  puntos_total: number;
  detalle: PatrocinioDetalle[];
}

export interface RangoHistorial {
  id_period: number;
  name_period: string;
  rango: string;
  puntos_personales: number;
}

export interface CampamentoRangos {
  id_lider: number;
  historial: RangoHistorial[];
  resumen_parte2: CampamentoParte2 | null;
}

export interface CrecimientoEquipo {
  id_customers: number;
  full_name: string;
  rango_abril: string;
  rango_mayo: string;
  rango_junio: string;
  rango_agosto: string;
  tipo_crecimiento: 'bronce' | 'plata' | 'oro';
  puntos: number;
}

export interface CampamentoEquipo {
  id_lider: number;
  total_crecimiento: number;
  nuevos_bronces: number;
  nuevos_platas: number;
  nuevos_oros: number;
  puntos_total: number;
  detalle: CrecimientoEquipo[];
}

export interface CampamentoInfo {
  nombre: string;
  fecha_campamento: string;
  periodo_calificacion: {
    inicio: string;
    fin: string;
    periodos_bd: number[];
    nota: string;
  };
  participantes: {
    mexico: { rango_minimo: string; cupos: number };
    usa: { rango_minimo: string; cupos: number };
  };
  puntos: {
    parte1: {
      nombre: string;
      patrocinio_3_productos: number;
      patrocinio_5_productos: number;
      seguimiento_recompra_5: number;
      nota: string;
    };
    parte2: {
      nombre: string;
      mantener_rango: number;
      subir_bronce: number;
      subir_plata: number;
      subir_oro: number;
      subir_platino: number;
      subir_diamante_o_superior: number;
      nota: string;
    };
    parte3: {
      nombre: string;
      nuevo_bronce: number;
      nuevo_plata: number;
      nuevo_oro: number;
      nota: string;
    };
  };
}

// Campamento API Functions
export async function getCampamentoInfo(): Promise<CampamentoInfo> {
  return fetchAPI<CampamentoInfo>('/campamento/info');
}

export async function getCampamentoRankingMexico(): Promise<CampamentoRanking> {
  return fetchAPI<CampamentoRanking>('/campamento/mexico/ranking');
}

export async function getCampamentoRankingUSA(): Promise<CampamentoRanking> {
  return fetchAPI<CampamentoRanking>('/campamento/usa/ranking');
}

export async function getCampamentoResumen(idLider: number): Promise<CampamentoResumen> {
  return fetchAPI<CampamentoResumen>(`/campamento/lider/${idLider}/resumen`);
}

export async function getCampamentoPatrocinios(idLider: number): Promise<CampamentoPatrocinios> {
  return fetchAPI<CampamentoPatrocinios>(`/campamento/lider/${idLider}/patrocinios`);
}

export async function getCampamentoRangos(idLider: number): Promise<CampamentoRangos> {
  return fetchAPI<CampamentoRangos>(`/campamento/lider/${idLider}/rangos`);
}

export async function getCampamentoEquipo(idLider: number): Promise<CampamentoEquipo> {
  return fetchAPI<CampamentoEquipo>(`/campamento/lider/${idLider}/equipo`);
}
