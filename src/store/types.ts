import type { FeatureCollection } from 'geojson'
import type { DetalhesCalculo } from '@/motor'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadStatus = 'novo' | 'em_analise' | 'aprovado' | 'contratado' | 'recusado' | 'efetivado'
export type MrvStatus  = 'rascunho' | 'pendente' | 'aprovado' | 'correcao'

export interface Lead {
  id: string
  parceiroId?: string
  nome: string
  email?: string
  telefone?: string
  fazenda: string
  municipio?: string
  estado?: string
  area: number
  culturas?: string[]
  manejoAtual?: string
  praticas?: string[]
  horizonteAnos?: number
  receitaEstimada?: number
  tco2eEstimado?: number
  status: LeadStatus
  motivoRecusa?: string
  data: string
}

export interface Fazenda {
  id: string
  produtorId: string
  nome: string
  municipio: string
  estado: string
  areaTotalHa: number
  kmlUrl?: string
  kmlGeoJson?: FeatureCollection
  zonaClimatica: 'tropical_umido' | 'tropical_seco'
}

export interface Talhao {
  id: string
  fazendaId: string
  nome: string
  areaHa: number
  tipo: 'projeto' | 'control_site' | 'excluido'
  // Solo
  socPercent?: number
  bdGCm3?: number
  argilaPercent?: number
  profundidadeCm: number
  pontosColetados?: number
  grupoSoloFao?: string
  texturaFao?: string
  topografia?: string
  dadosValidados: boolean
  // KML / mapa mock
  latCenter?: number
  lngCenter?: number
  socTimestamp?: string
}

export interface FertilizanteSint { tipo: string; qtdKgHa: number; usaInibidor: boolean; outroNome?: string }
export interface FertilizanteOrg  { tipo: string; qtdTHa: number; outroNome?: string }
export interface Calcario          { tipo: string; qtdTHa: number }
export interface OperacaoMec      { operacao: string; combustivel: string; litros: number }
export interface RegistroPecuaria {
  tipoAnimal: string; sistema: string; quantidade: number
  pesoMedio: number; mesesNaArea: number; dieta: string[]; dietaOutro?: string
}

export interface CulturaManejo {
  id: string
  nome: string
  dataPlantio?: string
  dataColheita?: string
  produtividade?: number
  unidadeProd?: 'sacas_ha' | 't_ha'
  hasSafrinha?: boolean
  safrinhaNome?: string
  safrinhaDataPlantio?: string
  safrinhaDataColheita?: string
  safrinhaProdutividade?: number
}

export interface PlantaCobertura {
  especie: string
  tipo: 'mix' | 'solteira'
  dataPlantio: string
}

export interface DadosManejoAnual {
  id: string
  talhaoId?: string
  fazendaId?: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto'
  status: MrvStatus
  comentarioCorrecao?: string
  // Lavoura
  cultura?: string
  culturas?: CulturaManejo[]
  plantasCobertura?: PlantaCobertura[]
  dataPlantio?: string
  dataColheita?: string
  produtividade?: number
  unidadeProd?: 'sacas_ha' | 't_ha'
  residuosCampo?: boolean
  queimaResiduos?: boolean
  usaIrrigacao?: boolean
  tipoIrrigacao?: string
  // Fertilização
  fertilizantesSint?: FertilizanteSint[]
  fertilizantesOrg?: FertilizanteOrg[]
  calcario?: Calcario[]
  produtosBiologicos?: { nome: string }[]
  // Operacional
  operacoes?: OperacaoMec[]
  // Pecuária
  pecuaria?: RegistroPecuaria[]
  versao: number
  submetidoEm?: string
  aprovadoEm?: string
}

export interface Cliente {
  id: string
  userId?: string
  nome: string
  email?: string
  cpfCnpj?: string
  area: number
  statusMRV: string
  motor: string
}

export interface Comissao {
  id: string
  parceiroId?: string
  leadId?: string
  fazenda: string
  parcela: string
  anoPagamento: number
  valor: number
  valorUsd?: number
  baseCalculo?: string
  status: 'pago' | 'projetado'
  dataVencimento: string
}

// ─── Enums Control Sites (VM0042 v2.2) ───────────────────────────────────────

export type ZonaClimaticaIPCC =
  | 'Tropical Moist' | 'Tropical Dry'
  | 'Warm Temperate Moist' | 'Warm Temperate Dry'
  | 'Cool Temperate Moist' | 'Cool Temperate Dry'
  | 'Boreal Moist' | 'Boreal Dry' | 'Polar Tundra'

export type ClasseDeclividade =
  | 'nearly_level' | 'gently_sloping' | 'strongly_sloping'
  | 'moderately_steep' | 'steep' | 'very_steep'

export type AspectoCar = 'N'|'NE'|'E'|'SE'|'S'|'SW'|'W'|'NW'

export type ClasseTexturaFAO =
  | 'Sandy' | 'Loamy' | 'Clayey' | 'Silty' | 'Sandy Loam' | 'Clay Loam'

export type GestorTipo = 'proponente' | 'parceiro' | 'externo'

export interface HistoricoManejoAnual {
  ano: number
  preparo_solo: 'plantio_direto' | 'convencional' | 'conservacao'
  tipo_cultura: string
  grupo_funcional: 'gramineas' | 'leguminosas' | 'broadleaf_nao_leguminosa'
  remocao_residuos: boolean
  esterco: boolean
  composto: boolean
  irrigacao: boolean
}

export interface ControlSite {
  id: string
  nome: string
  // === SPEC §2.1 — campos normativos ===
  centroide_lat?: number
  centroide_lng?: number
  area_ha?: number
  zona_climatica_ipcc?: ZonaClimaticaIPCC
  ecorregiao_wwf?: string
  classe_textural_fao?: ClasseTexturaFAO
  grupo_solo_wrb?: string
  classe_declividade?: ClasseDeclividade
  aspecto_cardinal?: AspectoCar
  precip_media_anual_mm?: number
  fonte_precip?: string
  dist_estacao_meteo_km?: number
  soc_medio_pct?: number
  soc_ic_lower?: number
  soc_ic_upper?: number
  n_amostras_soc?: number
  historico_manejo?: HistoricoManejoAnual[]
  cobertura_historica?: string
  ano_conversao?: number
  gestor_nome?: string
  gestor_tipo?: GestorTipo
  status_cs?: 'Ativo' | 'Em_implantacao' | 'Inativo'
  data_cadastro?: string
  data_primeira_coleta?: string
  // === Legado (compatibilidade com código existente) ===
  area: number
  status: string
  similaridade: number
  biome: string
  data: string
  topografia?: string
  texturaFao?: string
  distanciaKm?: number
  fazendasVinculadasIds?: string[]
  talhaoVinculadoIds?: string[]
}

export interface MatchResult {
  id: string
  controlSiteId: string
  fazendaId: string
  calculadoEm: string
  criterios: {
    c1_distancia: boolean;    c1_distanciaKm: number
    c2_zonaClimatica: boolean
    c3_ecorregiao: boolean
    c4_texturaFao: boolean
    c5_grupoSolo: boolean
    c6_declividade: boolean
    c7_precipitacao: boolean
    c8_soc: boolean | 'pendente'; c8_pvalor?: number
    c9_manejo: boolean;       c9_anosMatchados?: number
  }
  score: number
  matchTotal: boolean
  statusCobertura: 'coberta' | 'parcial' | 'descoberta'
  criteriosPendentes: string[]
}

export interface Parceiro {
  id: string
  userId?: string
  nome: string
  email: string
  leadsGerados: number
  comissaoTotal: number
  hectaresCarteira?: number
  status: 'ativo' | 'convidado'
  comissaoPercentual?: number
}

// ─── Novas entidades MVP ───────────────────────────────────────────────────────

export interface ColetaSolo {
  id: string
  fazendaId: string
  talhaoId: string
  talhaoNome: string
  safra: number
  pontosColetados: number
  profundidadeColeta: string
  socPercent: number
  bdGCm3: number
  registradoEm: string
  registradoPor: string
}

export interface CampoAlterado {
  campo: string
  valorAnterior: unknown
  valorNovo: unknown
}

export interface EventoHistorico {
  id: string
  fazendaId: string
  timestampUtc: string
  usuarioId: string
  usuarioNome: string
  tipoAtor: 'venture_carbon' | 'cliente'
  camposAlterados: CampoAlterado[]
  observacao?: string
}

export interface ParametroSistema {
  chave: string
  valor: number
  descricao: string
  editavel: boolean
  fonte?: string
  unidade?: string
}

export interface ResultadoMotor {
  id: string
  talhaoId: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto' | 'ambos'
  // SOC (RothC)
  socBaselineTcHa: number
  socProjetoTcHa: number
  deltaSocTcHa: number
  co2SocTco2eHa: number
  // N2O
  n2oBaselineTco2eHa: number
  n2oProjetoTco2eHa: number
  deltaN2oTco2eHa: number
  // CH4
  ch4BaselineTco2eHa: number
  ch4ProjetoTco2eHa: number
  deltaCh4Tco2eHa: number
  // CO2
  co2FfTco2eHa: number
  co2LimeTco2eHa: number
  // Totais
  erTTco2eHa: number
  crTTco2eHa: number
  lkTTco2eHa: number
  uncCo2: number
  uncN2o: number
  errNetTco2eHa: number
  bufferPoolRate: number
  vcusEmitidosHa: number
  vcusEmitidosTotal: number
  // Metadados
  rodadoEm: string
  versaoMotor: string
  parametrosUsados: Record<string, number>
  detalhesCalculo?: DetalhesCalculo
}

export interface DadoClimatico {
  id: string
  talhaoId: string
  tempMensal: number[]
  precipMensal: number[]
  evapMensal: number[]
  fonte: 'manual' | 'preset_cerrado' | 'preset_amazonia' | 'preset_pampa'
  atualizadoEm: string
}

export interface Notificacao {
  id: string
  para: 'cliente' | 'admin' | 'parceiro'
  userId?: string
  texto: string
  link?: string
  lida: boolean
  criadaEm: string
}

export interface Alerta {
  id: string
  texto: string
  link?: string
  resolvido: boolean
  criadoEm: string
}

export type UserRole = 'Super Admin' | 'Admin' | 'Editor' | 'Visualizador'

export interface AppUser {
  id: string
  nome: string
  email: string
  role: UserRole
  status: 'Ativo' | 'Bloqueado'
}
