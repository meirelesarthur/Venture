import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

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
  kmlGeoJson?: any          // GeoJSON parsed do KML (armazenado localmente)
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
  grupoSoloFao?: string
  texturaFao?: string
  topografia?: string
  dadosValidados: boolean
  // KML / mapa mock (coordenadas aproximadas para visualização)
  latCenter?: number
  lngCenter?: number
}

export interface FertilizanteSint { tipo: string; qtdKgHa: number; usaInibidor: boolean }
export interface FertilizanteOrg  { tipo: string; qtdTHa: number }
export interface Calcario          { tipo: string; qtdTHa: number }
export interface OperacaoMec      { operacao: string; combustivel: string; litros: number }
export interface RegistroPecuaria {
  tipoAnimal: string; sistema: string; quantidade: number
  pesoMedio: number; mesesNaArea: number; dieta: string
}

export interface DadosManejoAnual {
  id: string
  talhaoId: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto'
  status: MrvStatus
  comentarioCorrecao?: string
  // Lavoura
  cultura?: string
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
  parcela: string         // 'Ano 0' | 'Ano 2' | ...
  anoPagamento: number
  valor: number
  valorUsd?: number
  baseCalculo?: string
  status: 'pago' | 'projetado'
  dataVencimento: string
}

export interface ControlSite {
  id: string
  nome: string
  area: number
  status: string
  similaridade: number
  biome: string
  data: string
  topografia?: string
  texturaFao?: string
  distanciaKm?: number
  fazendaVinculadaId?: string
  talhaoVinculadoIds?: string[]
}

export interface Parceiro {
  id: string
  nome: string
  email: string
  leadsGerados: number
  comissaoTotal: number
  hectaresCarteira?: number
  status: 'ativo' | 'convidado'
}

// ─── Novas entidades MVP ───────────────────────────────────────────────────────

export interface ParametroSistema {
  chave: string
  valor: number
  descricao: string
  editavel: boolean         // false = constante metodológica
  fonte?: string            // justificativa se admin sobrescrever
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
}

export interface DadoClimatico {
  id: string
  talhaoId: string
  tempMensal: number[]      // 12 valores Jan–Dez (°C)
  precipMensal: number[]    // 12 valores Jan–Dez (mm)
  evapMensal: number[]      // 12 valores Jan–Dez (mm)
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

// ─── Parâmetros iniciais (todos os 18 + fatores SOC) ─────────────────────────

const initialParametros: ParametroSistema[] = [
  // Financeiros (editáveis)
  { chave: 'preco_base_usd',       valor: 20,      descricao: 'Preço base do crédito (USD/VCU)',        editavel: true,  unidade: 'USD' },
  { chave: 'ptax_fallback',        valor: 5.65,    descricao: 'PTAX simulado (R$/USD)',                 editavel: true,  unidade: 'R$'  },
  { chave: 'buffer_pool',          valor: 0.15,    descricao: 'Buffer pool (fração)',                   editavel: true,  unidade: '%'   },
  { chave: 'comissao_base_usd_ha', valor: 1.00,    descricao: 'Comissão base parceiro (USD/ha)',        editavel: true,  unidade: 'USD' },
  // GWP (somente leitura)
  { chave: 'gwp_ch4',              valor: 28,      descricao: 'GWP CH₄ IPCC AR5',                      editavel: false, unidade: 'GWP' },
  { chave: 'gwp_n2o',              valor: 265,     descricao: 'GWP N₂O IPCC AR5',                      editavel: false, unidade: 'GWP' },
  // EF N2O (somente leitura com override)
  { chave: 'ef1_n2o_default',      valor: 0.01,    descricao: 'EF1 N₂O solos minerais (padrão)',       editavel: false, unidade: 'kgN2O/kgN' },
  { chave: 'ef1_n2o_inibidor',     valor: 0.005,   descricao: 'EF1 N₂O com inibidor de nitrificação', editavel: false, unidade: 'kgN2O/kgN' },
  { chave: 'ef1_n2o_umido',        valor: 0.016,   descricao: 'EF1 N₂O tropical úmido',               editavel: false, unidade: 'kgN2O/kgN' },
  { chave: 'ef1_n2o_seco',         valor: 0.005,   descricao: 'EF1 N₂O tropical seco',                editavel: false, unidade: 'kgN2O/kgN' },
  // Frações volat/leach (somente leitura)
  { chave: 'frac_gasf',            valor: 0.11,    descricao: 'Frac_GASF fertilizante sintético',      editavel: false, unidade: 'fração' },
  { chave: 'frac_gasf_ureia',      valor: 0.15,    descricao: 'Frac_GASF ureia',                       editavel: false, unidade: 'fração' },
  { chave: 'frac_gasm',            valor: 0.21,    descricao: 'Frac_GASM fertilizante orgânico',       editavel: false, unidade: 'fração' },
  { chave: 'frac_leach',           valor: 0.24,    descricao: 'Frac_LEACH lixiviação (úmido/irrigado)',editavel: false, unidade: 'fração' },
  { chave: 'ef4_n2o_volat',        valor: 0.014,   descricao: 'EF4 N₂O volatilização NH3/NOx',        editavel: false, unidade: 'kgN2O/kgN' },
  { chave: 'ef5_n2o_leach',        valor: 0.011,   descricao: 'EF5 N₂O lixiviação/escoamento',        editavel: false, unidade: 'kgN2O/kgN' },
  // EF CO2 (somente leitura)
  { chave: 'ef_diesel',            valor: 0.002886,descricao: 'EF CO₂ diesel (tCO₂/L)',               editavel: false, unidade: 'tCO2/L' },
  { chave: 'ef_gasolina',          valor: 0.002310,descricao: 'EF CO₂ gasolina (tCO₂/L)',             editavel: false, unidade: 'tCO2/L' },
  { chave: 'ef_limestone',         valor: 0.12,    descricao: 'EF calcário calcítico (tC/t)',          editavel: false, unidade: 'tC/t' },
  { chave: 'ef_dolomite',          valor: 0.13,    descricao: 'EF dolomita (tC/t)',                    editavel: false, unidade: 'tC/t' },
  // Fatores SOC simulador (editáveis)
  { chave: 'soc_fator_spdpd',      valor: 2.5,     descricao: 'Fator SOC — Plantio Direto (SPD)',      editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_cobertura',  valor: 2.0,     descricao: 'Fator SOC — Plantas de Cobertura',     editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_rotacao',    valor: 1.2,     descricao: 'Fator SOC — Rotação de Culturas',      editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_ilpf',       valor: 3.5,     descricao: 'Fator SOC — ILPF/ILP',                editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_pastagem',   valor: 3.0,     descricao: 'Fator SOC — Reforma de Pastagem',      editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_org',        valor: 1.5,     descricao: 'Fator SOC — Adubação Orgânica',        editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_biologicos', valor: 0.8,     descricao: 'Fator SOC — Biológicos/Inoculantes',   editavel: true,  unidade: 'tCO2/ha/ano' },
  { chave: 'soc_fator_rotac_past', valor: 1.8,     descricao: 'Fator SOC — Manejo Rotacionado Pasto', editavel: true,  unidade: 'tCO2/ha/ano' },
  // Leakage (editável)
  { chave: 'fator_leakage',        valor: 0.05,    descricao: 'Fator de leakage padrão (VMD0054)', editavel: true, unidade: 'fração' },
]

// ─── Mock data ─────────────────────────────────────────────────────────────────

const initialLeads: Lead[] = [
  { id: 'l1', parceiroId: 'p1', nome: 'João da Silva', email: 'joao@email.com', telefone: '(65) 99812-3456', fazenda: 'Fazenda Boa Vista', municipio: 'Sorriso', estado: 'MT', area: 1200, culturas: ['Soja', 'Milho'], receitaEstimada: 284700, tco2eEstimado: 1245, status: 'aprovado', data: '12/10/2025' },
  { id: 'l2', parceiroId: 'p1', nome: 'Fazendas Reunidas Agrop.', email: 'contato@agrop.com.br', fazenda: 'Agrop. São José', municipio: 'Lucas do Rio Verde', estado: 'MT', area: 5000, culturas: ['Soja', 'Algodão'], status: 'em_analise', data: '05/11/2025' },
  { id: 'l3', parceiroId: 'p2', nome: 'Marcos Antônio', email: 'marcos@email.com', fazenda: 'Sítio das Águas', municipio: 'Cristalina', estado: 'GO', area: 850, culturas: ['Soja', 'Trigo'], receitaEstimada: 101388, tco2eEstimado: 530, status: 'contratado', data: '22/08/2025' },
  { id: 'l4', parceiroId: 'p2', nome: 'Pedro Henrique', email: 'pedro@email.com', fazenda: 'Estância Bela', municipio: 'Rondonópolis', estado: 'MT', area: 300, culturas: ['Pastagem'], status: 'recusado', motivoRecusa: 'Área abaixo do mínimo elegível (500 ha)', data: '15/09/2025' },
  { id: 'l5', parceiroId: 'p1', nome: 'Cooperativa Agro Cerrado', email: 'admin@agrocerrado.coop', fazenda: 'Fazenda Santa Luzia', municipio: 'Campo Verde', estado: 'MT', area: 3200, culturas: ['Soja', 'Milho', 'Algodão'], status: 'novo', data: '28/01/2026' },
]

const initialClientes: Cliente[] = [
  { id: 'c1', userId: 'cliente-1', nome: 'João da Silva', email: 'joao@fazendaboavista.com.br', area: 1200, statusMRV: 'Em Validação', motor: 'Pendente' },
  { id: 'c2', nome: 'Agrop. São José', email: 'contato@agrop.com.br', area: 5000, statusMRV: 'Auditoria Aprovada', motor: 'Rodado' },
  { id: 'c3', nome: 'Marcos Antônio', email: 'marcos@email.com', area: 850, statusMRV: 'Em submissão', motor: 'N/A' },
]

const initialFazendas: Fazenda[] = [
  { id: 'f1', produtorId: 'c1', nome: 'Fazenda Boa Vista', municipio: 'Sorriso', estado: 'MT', areaTotalHa: 1200, zonaClimatica: 'tropical_umido' },
  { id: 'f2', produtorId: 'c2', nome: 'Agrop. São José', municipio: 'Lucas do Rio Verde', estado: 'MT', areaTotalHa: 5000, zonaClimatica: 'tropical_umido' },
  { id: 'f3', produtorId: 'c3', nome: 'Sítio das Águas', municipio: 'Cristalina', estado: 'GO', areaTotalHa: 850, zonaClimatica: 'tropical_seco' },
]

const initialTalhoes: Talhao[] = [
  { id: 't1', fazendaId: 'f1', nome: 'Talhão A1', areaHa: 450, tipo: 'projeto', socPercent: 2.1, bdGCm3: 1.35, argilaPercent: 42, profundidadeCm: 30, dadosValidados: true, latCenter: -12.54, lngCenter: -55.72 },
  { id: 't2', fazendaId: 'f1', nome: 'Talhão A2', areaHa: 380, tipo: 'projeto', socPercent: 1.9, bdGCm3: 1.40, argilaPercent: 38, profundidadeCm: 30, dadosValidados: false, latCenter: -12.56, lngCenter: -55.70 },
  { id: 't3', fazendaId: 'f1', nome: 'Talhão B1 (Controle)', areaHa: 120, tipo: 'control_site', profundidadeCm: 30, dadosValidados: false, latCenter: -12.52, lngCenter: -55.68 },
  { id: 't4', fazendaId: 'f1', nome: 'Reserva Legal', areaHa: 250, tipo: 'excluido', profundidadeCm: 30, dadosValidados: false, latCenter: -12.50, lngCenter: -55.75 },
  { id: 't5', fazendaId: 'f2', nome: 'Talhão C1', areaHa: 1200, tipo: 'projeto', socPercent: 2.4, bdGCm3: 1.28, argilaPercent: 55, profundidadeCm: 50, dadosValidados: true, latCenter: -13.05, lngCenter: -55.90 },
  { id: 't6', fazendaId: 'f2', nome: 'Talhão C2', areaHa: 1000, tipo: 'projeto', profundidadeCm: 30, dadosValidados: false, latCenter: -13.07, lngCenter: -55.92 },
]

const initialManejo: DadosManejoAnual[] = [
  {
    id: 'm1', talhaoId: 't1', anoAgricola: 2025, cenario: 'projeto', status: 'aprovado',
    cultura: 'soja', dataPlantio: '2025-10-15', dataColheita: '2026-02-10', produtividade: 62, unidadeProd: 'sacas_ha',
    residuosCampo: true, queimaResiduos: false, usaIrrigacao: false,
    fertilizantesSint: [{ tipo: 'ureia', qtdKgHa: 80, usaInibidor: false }, { tipo: 'map', qtdKgHa: 120, usaInibidor: false }],
    fertilizantesOrg: [{ tipo: 'esterco_bovino', qtdTHa: 3 }],
    calcario: [{ tipo: 'calcitico', qtdTHa: 1.5 }],
    operacoes: [{ operacao: 'plantio', combustivel: 'diesel', litros: 8 }, { operacao: 'colheita', combustivel: 'diesel', litros: 12 }],
    versao: 1, aprovadoEm: '2026-03-10',
  },
  {
    id: 'm2', talhaoId: 't2', anoAgricola: 2025, cenario: 'projeto', status: 'pendente',
    cultura: 'milho', dataPlantio: '2026-01-20', dataColheita: '2026-06-10', produtividade: 120, unidadeProd: 'sacas_ha',
    residuosCampo: true, queimaResiduos: false, usaIrrigacao: true, tipoIrrigacao: 'pivo',
    fertilizantesSint: [{ tipo: 'ureia', qtdKgHa: 200, usaInibidor: true }],
    operacoes: [{ operacao: 'plantio', combustivel: 'diesel', litros: 10 }],
    versao: 1, submetidoEm: '2026-03-28',
  },
  {
    id: 'm3', talhaoId: 't5', anoAgricola: 2025, cenario: 'projeto', status: 'correcao',
    comentarioCorrecao: 'Produtividade acima do esperado para a região. Confirmar e anexar nota fiscal.',
    cultura: 'soja', versao: 1, submetidoEm: '2026-03-20',
  },
  {
    id: 'm4', talhaoId: 't1', anoAgricola: 2024, cenario: 'baseline', status: 'aprovado',
    cultura: 'soja', dataPlantio: '2024-10-10', dataColheita: '2025-02-15', produtividade: 58, unidadeProd: 'sacas_ha',
    residuosCampo: false, queimaResiduos: true, usaIrrigacao: false,
    fertilizantesSint: [{ tipo: 'ureia', qtdKgHa: 100, usaInibidor: false }],
    operacoes: [{ operacao: 'plantio', combustivel: 'diesel', litros: 12 }, { operacao: 'colheita', combustivel: 'diesel', litros: 14 }],
    versao: 1, aprovadoEm: '2025-04-01',
  },
]

const initialComissoes: Comissao[] = [
  { id: 'co1', parceiroId: 'p1', leadId: 'l1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 0', anoPagamento: 0, valor: 6600, valorUsd: 1200, baseCalculo: '1.200 ha × $1,00/ha × R$5,50', status: 'pago', dataVencimento: '15/10/2025' },
  { id: 'co2', parceiroId: 'p2', leadId: 'l3', fazenda: 'Sítio das Águas',   parcela: 'Ano 0', anoPagamento: 0, valor: 4675, valorUsd: 850,  baseCalculo: '850 ha × $1,00/ha × R$5,50',   status: 'pago', dataVencimento: '22/08/2025' },
  { id: 'co3', parceiroId: 'p1', leadId: 'l1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 2', anoPagamento: 2, valor: 3300, valorUsd: 600,  baseCalculo: '(2.4/2) × 1.200 ha × $1,00',  status: 'projetado', dataVencimento: '15/10/2027' },
  { id: 'co4', parceiroId: 'p2', leadId: 'l3', fazenda: 'Sítio das Águas',   parcela: 'Ano 2', anoPagamento: 2, valor: 2337, valorUsd: 425,  baseCalculo: '(2.0/2) × 850 ha × $1,00',    status: 'projetado', dataVencimento: '22/08/2027' },
  { id: 'co5', parceiroId: 'p1', leadId: 'l1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 4', anoPagamento: 4, valor: 2750, valorUsd: 500,  baseCalculo: '(2.4/2) × 1.200 ha × $1,00',  status: 'projetado', dataVencimento: '15/10/2029' },
  { id: 'co6', parceiroId: 'p1', leadId: 'l1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 6', anoPagamento: 6, valor: 2750, valorUsd: 500,  baseCalculo: '(2.4/2) × 1.200 ha × $1,00',  status: 'projetado', dataVencimento: '15/10/2031' },
  { id: 'co7', parceiroId: 'p1', leadId: 'l1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 8', anoPagamento: 8, valor: 2750, valorUsd: 500,  baseCalculo: '(2.4/2) × 1.200 ha × $1,00',  status: 'projetado', dataVencimento: '15/10/2033' },
  { id: 'co8', parceiroId: 'p1', leadId: 'l1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 10', anoPagamento: 10, valor: 2750, valorUsd: 500, baseCalculo: '(2.4/2) × 1.200 ha × $1,00', status: 'projetado', dataVencimento: '15/10/2035' },
]

const initialSites: ControlSite[] = [
  { id: 's1', nome: 'Site Controle Sul MT-01', area: 54, status: 'Valido', similaridade: 9, biome: 'Cerrado', data: '10/01/2026', topografia: 'suave_ondulado', texturaFao: 'argilo-arenosa', distanciaKm: 12, fazendaVinculadaId: 'f1', talhaoVinculadoIds: ['t1','t2'] },
  { id: 's2', nome: 'Site Controle Sorriso-02', area: 120, status: 'Valido', similaridade: 11, biome: 'Cerrado', data: '05/02/2026', topografia: 'plano', texturaFao: 'argilosa', distanciaKm: 8, fazendaVinculadaId: 'f1', talhaoVinculadoIds: ['t1'] },
  { id: 's3', nome: 'Site Controle Cerrado-03', area: 85, status: 'Alerta', similaridade: 7, biome: 'Cerrado', data: '22/03/2026', topografia: 'ondulado', texturaFao: 'franco-argilosa', distanciaKm: 47, fazendaVinculadaId: 'f1', talhaoVinculadoIds: ['t2'] },
]

const initialParceiros: Parceiro[] = [
  { id: 'p1', nome: 'AgroConsult Ltda', email: 'contato@agroconsult.com', leadsGerados: 12, comissaoTotal: 15400, hectaresCarteira: 6050, status: 'ativo' },
  { id: 'p2', nome: 'Sindicato Rural MG', email: 'sindicato@ruralmg.org', leadsGerados: 5, comissaoTotal: 7012, hectaresCarteira: 850, status: 'ativo' },
  { id: 'p3', nome: 'TechFarm Solutions', email: 'hello@techfarm.ag', leadsGerados: 0, comissaoTotal: 0, hectaresCarteira: 0, status: 'convidado' },
]

const initialUsuarios: AppUser[] = [
  { id: 'u1', nome: 'Admin Principal', email: 'admin@venturecarbon.com', role: 'Super Admin', status: 'Ativo' },
  { id: 'u2', nome: 'Auditor Externo', email: 'auditor@certificadora.com', role: 'Visualizador', status: 'Ativo' },
  { id: 'u3', nome: 'João G. (Operações)', email: 'operacoes@venturecarbon.com', role: 'Editor', status: 'Bloqueado' },
]

// Clima padrão Cerrado Úmido (ref. INMET/Sorriso-MT média 30 anos)
const PRESET_CERRADO_UMIDO = {
  tempMensal:   [27.2, 27.0, 26.8, 26.5, 25.2, 24.1, 23.8, 25.0, 27.0, 27.5, 27.3, 27.1],
  precipMensal: [230,  210,  200,  100,   30,   10,    5,   20,   80,  160,  210,  240],
  evapMensal:   [100,   90,   95,  105,   95,   85,   90,  100,  110,  115,  105,  100],
}

const initialClimaticos: DadoClimatico[] = [
  { id: 'cl1', talhaoId: 't1', ...PRESET_CERRADO_UMIDO, fonte: 'preset_cerrado', atualizadoEm: '2026-01-01' },
  { id: 'cl2', talhaoId: 't2', ...PRESET_CERRADO_UMIDO, fonte: 'preset_cerrado', atualizadoEm: '2026-01-01' },
  { id: 'cl3', talhaoId: 't5', ...PRESET_CERRADO_UMIDO, fonte: 'preset_cerrado', atualizadoEm: '2026-01-01' },
]

// Um resultado de motor pré-calculado para t1/2024 para popular ResultadosPage
const initialResultados: ResultadoMotor[] = [
  {
    id: 'r1', talhaoId: 't1', anoAgricola: 2024, cenario: 'ambos',
    socBaselineTcHa: 58.18, socProjetoTcHa: 59.86, deltaSocTcHa: 1.68, co2SocTco2eHa: 6.16,
    n2oBaselineTco2eHa: 1.24, n2oProjetoTco2eHa: 0.89, deltaN2oTco2eHa: 0.35,
    ch4BaselineTco2eHa: 0.0, ch4ProjetoTco2eHa: 0.0, deltaCh4Tco2eHa: 0.0,
    co2FfTco2eHa: 0.058, co2LimeTco2eHa: 0.066,
    erTTco2eHa: 0.226, crTTco2eHa: 5.852, lkTTco2eHa: 0,
    uncCo2: 0.0654, uncN2o: 0.15,
    errNetTco2eHa: 6.078, bufferPoolRate: 0.15,
    vcusEmitidosHa: 5.166, vcusEmitidosTotal: 2325,
    rodadoEm: '2026-03-10T14:23:00Z', versaoMotor: '1.0.0-ts',
    parametrosUsados: { gwp_ch4: 28, gwp_n2o: 265, ef1_n2o_default: 0.01, buffer_pool: 0.15 },
  },
]

// ─── Store interface ───────────────────────────────────────────────────────────

interface DataState {
  leads: Lead[]
  clientes: Cliente[]
  fazendas: Fazenda[]
  talhoes: Talhao[]
  manejo: DadosManejoAnual[]
  comissoes: Comissao[]
  controlSites: ControlSite[]
  parceiros: Parceiro[]
  parametros: ParametroSistema[]
  resultadosMotor: ResultadoMotor[]
  dadosClimaticos: DadoClimatico[]
  notificacoes: Notificacao[]
  alertas: Alerta[]
  usuarios: AppUser[]

  // Lead
  addLead: (lead: Omit<Lead, 'id' | 'data'>) => string
  updateLeadStatus: (id: string, status: LeadStatus, motivo?: string) => void
  convertLeadToCliente: (leadId: string) => void

  // Fazenda / Talhão
  addFazenda: (f: Omit<Fazenda, 'id'>) => string
  updateFazenda: (id: string, changes: Partial<Fazenda>) => void
  addTalhao: (t: Omit<Talhao, 'id'>) => string
  updateTalhao: (id: string, changes: Partial<Talhao>) => void

  // MRV
  saveManejoRascunho: (data: Omit<DadosManejoAnual, 'id' | 'versao'>) => string
  updateManejo: (id: string, changes: Partial<DadosManejoAnual>) => void
  submitManejo: (id: string) => void
  approveManejo: (id: string) => void
  requestCorrection: (id: string, comentario: string) => void

  // Control Sites
  addControlSite: (site: Omit<ControlSite, 'id'>) => void
  updateControlSite: (id: string, changes: Partial<ControlSite>) => void

  // Parâmetros
  setParametro: (chave: string, valor: number, fonte?: string) => void
  getParam: (chave: string) => number

  // Motor
  addResultadoMotor: (r: Omit<ResultadoMotor, 'id'>) => string
  clearResultadosTalhao: (talhaoId: string, ano: number) => void

  // Clima
  saveDadoClimatico: (dado: Omit<DadoClimatico, 'id' | 'atualizadoEm'>) => void

  // Notificações
  addNotificacao: (n: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>) => void
  marcarLida: (id: string) => void
  marcarTodasLidas: (para: Notificacao['para']) => void

  // Alertas
  addAlerta: (a: Omit<Alerta, 'id' | 'criadoEm' | 'resolvido'>) => void
  resolverAlerta: (id: string) => void

  // Usuários
  addUsuario: (u: Omit<AppUser, 'id'>) => void
  updateUsuario: (id: string, changes: Partial<AppUser>) => void

  // Util
  resetToInitialData: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      leads: initialLeads,
      clientes: initialClientes,
      fazendas: initialFazendas,
      talhoes: initialTalhoes,
      manejo: initialManejo,
      comissoes: initialComissoes,
      controlSites: initialSites,
      parceiros: initialParceiros,
      parametros: initialParametros,
      resultadosMotor: initialResultados,
      dadosClimaticos: initialClimaticos,
      notificacoes: [],
      alertas: [
        { id: 'al1', texto: 'Falha no sync do motor (Processo X).', resolvido: false, criadoEm: new Date().toISOString() },
        { id: 'al2', texto: 'Site de controle SC-03 perdeu similaridade >10%.', resolvido: false, criadoEm: new Date().toISOString() }
      ],
      usuarios: initialUsuarios,

      // ── Lead ──────────────────────────────────────────────────
      addLead: (leadData) => {
        const id = uuidv4()
        set((state) => ({
          leads: [...state.leads, { ...leadData, id, data: new Date().toLocaleDateString('pt-BR') }],
        }))
        return id
      },

      updateLeadStatus: (id, status, motivo) =>
        set((state) => ({
          leads: state.leads.map((l) => l.id === id ? { ...l, status, motivoRecusa: motivo } : l),
        })),

      convertLeadToCliente: (leadId) =>
        set((state) => {
          const lead = state.leads.find((l) => l.id === leadId)
          if (!lead) return state
          const newCliente: Cliente = {
            id: uuidv4(), nome: lead.nome, email: lead.email,
            area: lead.area, statusMRV: 'Aberto', motor: 'N/A',
          }
          // Cria comissão Ano 0 automaticamente
          const ptax = state.parametros.find(p => p.chave === 'ptax_fallback')?.valor ?? 5.65
          const comissaoBase = state.parametros.find(p => p.chave === 'comissao_base_usd_ha')?.valor ?? 1.00
          const valorUsd = lead.area * comissaoBase
          const newComissao: Comissao = {
            id: uuidv4(),
            parceiroId: lead.parceiroId ?? '',
            leadId: lead.id,
            fazenda: lead.fazenda,
            parcela: 'Ano 0',
            anoPagamento: new Date().getFullYear(),
            valor: valorUsd * ptax,
            valorUsd,
            baseCalculo: `${lead.area} ha × US$ ${comissaoBase}/ha × R$ ${ptax}`,
            status: 'projetado',
            dataVencimento: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString('pt-BR'),
          }
          return {
            leads: state.leads.map((l) => l.id === leadId ? { ...l, status: 'efetivado' } : l),
            clientes: [...state.clientes, newCliente],
            comissoes: lead.parceiroId ? [...state.comissoes, newComissao] : state.comissoes,
          }
        }),

      // ── Fazenda/Talhão ────────────────────────────────────────
      addFazenda: (f) => {
        const id = uuidv4()
        set((state) => ({ fazendas: [...state.fazendas, { ...f, id }] }))
        return id
      },

      updateFazenda: (id, changes) =>
        set((state) => ({
          fazendas: state.fazendas.map((f) => f.id === id ? { ...f, ...changes } : f),
        })),

      addTalhao: (t) => {
        const id = uuidv4()
        set((state) => ({ talhoes: [...state.talhoes, { ...t, id }] }))
        return id
      },

      updateTalhao: (id, changes) =>
        set((state) => ({
          talhoes: state.talhoes.map((t) => t.id === id ? { ...t, ...changes } : t),
        })),

      // ── MRV ──────────────────────────────────────────────────
      saveManejoRascunho: (data) => {
        const existing = get().manejo.find(
          (m) => m.talhaoId === data.talhaoId && m.anoAgricola === data.anoAgricola && m.cenario === data.cenario
        )
        if (existing) {
          set((state) => ({
            manejo: state.manejo.map((m) =>
              m.id === existing.id ? { ...m, ...data, versao: m.versao } : m
            ),
          }))
          return existing.id
        }
        const id = uuidv4()
        set((state) => ({ manejo: [...state.manejo, { ...data, id, versao: 1 }] }))
        return id
      },

      updateManejo: (id, changes) =>
        set((state) => ({
          manejo: state.manejo.map((m) => m.id === id ? { ...m, ...changes } : m),
        })),

      submitManejo: (id) =>
        set((state) => ({
          manejo: state.manejo.map((m) =>
            m.id === id ? { ...m, status: 'pendente', submetidoEm: new Date().toISOString() } : m
          ),
        })),

      approveManejo: (id) => {
        set((state) => ({
          manejo: state.manejo.map((m) =>
            m.id === id ? { ...m, status: 'aprovado', versao: m.versao + 1, aprovadoEm: new Date().toISOString() } : m
          ),
        }))
        // Notificação interna
        const m = get().manejo.find(x => x.id === id)
        if (m) get().addNotificacao({ para: 'cliente', texto: `Seus dados MRV (Safra ${m.anoAgricola}/${m.anoAgricola+1}) foram aprovados! O motor de cálculos pode ser executado.`, link: '/dashboard/mrv' })
      },

      requestCorrection: (id, comentario) => {
        set((state) => ({
          manejo: state.manejo.map((m) =>
            m.id === id ? { ...m, status: 'correcao', comentarioCorrecao: comentario } : m
          ),
        }))
        get().addNotificacao({ para: 'cliente', texto: `Correção solicitada nos seus dados MRV. Acesse o MRV para revisar: "${comentario.slice(0,60)}..."`, link: '/dashboard/mrv' })
      },

      // ── Control Sites ─────────────────────────────────────────
      addControlSite: (siteData) =>
        set((state) => ({
          controlSites: [...state.controlSites, { ...siteData, id: uuidv4() }],
        })),

      updateControlSite: (id, changes) =>
        set((state) => ({
          controlSites: state.controlSites.map((s) => s.id === id ? { ...s, ...changes } : s),
        })),

      // ── Parâmetros ────────────────────────────────────────────
      setParametro: (chave, valor, fonte) =>
        set((state) => ({
          parametros: state.parametros.map((p) =>
            p.chave === chave ? { ...p, valor, fonte: fonte ?? p.fonte } : p
          ),
        })),

      getParam: (chave) => {
        const p = get().parametros.find((x) => x.chave === chave)
        return p?.valor ?? 0
      },

      // ── Motor ─────────────────────────────────────────────────
      addResultadoMotor: (r) => {
        const id = uuidv4()
        set((state) => ({ resultadosMotor: [...state.resultadosMotor, { ...r, id }] }))
        return id
      },

      clearResultadosTalhao: (talhaoId, ano) =>
        set((state) => ({
          resultadosMotor: state.resultadosMotor.filter(
            (r) => !(r.talhaoId === talhaoId && r.anoAgricola === ano)
          ),
        })),

      // ── Clima ─────────────────────────────────────────────────
      saveDadoClimatico: (dado) => {
        const id = uuidv4()
        const atualizadoEm = new Date().toISOString()
        set((state) => ({
          dadosClimaticos: [
            ...state.dadosClimaticos.filter((d) => d.talhaoId !== dado.talhaoId),
            { ...dado, id, atualizadoEm },
          ],
        }))
      },

      // ── Notificações ──────────────────────────────────────────
      addNotificacao: (n) =>
        set((state) => ({
          notificacoes: [
            { ...n, id: uuidv4(), criadaEm: new Date().toISOString(), lida: false },
            ...state.notificacoes,
          ],
        })),

      marcarLida: (id) =>
        set((state) => ({
          notificacoes: state.notificacoes.map((n) => n.id === id ? { ...n, lida: true } : n),
        })),

      marcarTodasLidas: (para) =>
        set((state) => ({
          notificacoes: state.notificacoes.map((n) =>
            n.para === para ? { ...n, lida: true } : n
          ),
        })),

      // ── Alertas ───────────────────────────────────────────────
      addAlerta: (a) =>
        set((state) => ({
          alertas: [
            { ...a, id: uuidv4(), criadoEm: new Date().toISOString(), resolvido: false },
            ...state.alertas,
          ],
        })),

      resolverAlerta: (id) =>
        set((state) => ({
          alertas: state.alertas.map((a) => a.id === id ? { ...a, resolvido: true } : a),
        })),

      // ── Usuários ──────────────────────────────────────────────
      addUsuario: (u) =>
        set((state) => ({
          usuarios: [...state.usuarios, { ...u, id: uuidv4() }],
        })),

      updateUsuario: (id, changes) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) => u.id === id ? { ...u, ...changes } : u),
        })),

      // ── Util ──────────────────────────────────────────────────
      resetToInitialData: () =>
        set({
          leads: initialLeads, clientes: initialClientes, fazendas: initialFazendas,
          talhoes: initialTalhoes, manejo: initialManejo, comissoes: initialComissoes,
          controlSites: initialSites, parceiros: initialParceiros,
          parametros: initialParametros, resultadosMotor: initialResultados,
          dadosClimaticos: initialClimaticos, notificacoes: [],
          alertas: [
            { id: 'al1', texto: 'Falha no sync do motor (Processo X).', resolvido: false, criadoEm: new Date().toISOString() },
            { id: 'al2', texto: 'Site de controle SC-03 perdeu similaridade >10%.', resolvido: false, criadoEm: new Date().toISOString() }
          ],
          usuarios: initialUsuarios,
        }),
    }),
    { name: 'venture-carbon-data' }
  )
)
