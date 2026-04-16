# Venture Carbon — Plano de Implantação Completo (v3)
> Briefing para Vibe Coding · VM0042 v2.2 | RothC-26.3 | VMD0053 v2.1  
> Versão 3.0 · Atualizado MVP Client-Side · Abril 2026 · Confidencial

---

## Índice

1. [Visão Geral da Plataforma](#1-visão-geral-da-plataforma)
2. [Design System](#2-design-system)
3. [Arquitetura Técnica](#3-arquitetura-técnica)
4. [Modelos de Dados (Entidades)](#4-modelos-de-dados-entidades)
5. [Regras de Negócio e Cálculos](#5-regras-de-negócio-e-cálculos)
6. [Módulo Control Sites — VM0042 §8.2](#6-módulo-control-sites--vm0042-82)
7. [Perfis de Usuário e Permissões](#7-perfis-de-usuário-e-permissões)
8. [Jornada 1 — Simulador de Leads](#8-jornada-1--simulador-de-leads)
9. [Jornada 2 — MRV Digital (Cliente)](#9-jornada-2--mrv-digital-cliente)
10. [Jornada 3 — Painel do Parceiro](#10-jornada-3--painel-do-parceiro)
11. [Jornada 4 — Painel Admin (Venture Carbon)](#11-jornada-4--painel-admin-venture-carbon)
12. [Motor de Cálculos (TypeScript Client-Side)](#12-motor-de-cálculos-typescript-client-side)
13. [Integrações Externas](#13-integrações-externas)
14. [Fases de Implementação (Status Atual)](#14-fases-de-implementação-status-atual)

---

## 1. Visão Geral da Plataforma

A **Venture Carbon** é uma plataforma SaaS de MRV (Monitoramento, Reporte e Verificação) de créditos de carbono para o agronegócio brasileiro. Opera conforme as metodologias Verra VM0042 v2.2 (redução de emissões em lavouras) e RothC-26.3 (modelo bioquímico de carbono do solo).

> **Nota arquitetural v3:** Diferente do planejamento original (Next.js + Python FastAPI + PostgreSQL), o MVP atual está implementado como uma **SPA 100% client-side** com React + Vite. O motor de cálculos foi portado integralmente para TypeScript e o estado persiste via Zustand + `localStorage`. A migração para backend real é prevista para as fases futuras.

### 1.1 Quatro Perfis de Uso

| Perfil | Acesso | Objetivo |
|--------|--------|----------|
| **Lead (não autenticado)** | URL pública `/simulacao` | Estimar receita com créditos de carbono |
| **Produtor/Cliente** | Login autenticado | Inserir dados de MRV, acompanhar créditos gerados |
| **Parceiro** | Login autenticado | Indicar leads, acompanhar comissões |
| **Admin Venture** | Login privilegiado | Validar dados, gerir projetos, rodar motor, configurar parâmetros |

### 1.2 Fluxo Macro

```
Lead acessa /simulacao
  → Simulação rápida (cálculo frontend, sem RothC)
    → Resultado estimado → CTA "Criar Conta" ou "Falar com Consultor"

Produtor cria conta / Admin cadastra
  → Dashboard cliente (6 fases de MRV)
    → Submissão dados → Admin aprova → Dados travados (append-only)
      → Admin roda Motor TypeScript (RothC + QA3 + Créditos)
        → VCUs líquidos calculados e exibidos com detalhamento auditável

Parceiro indica lead → Admin analisa → Aprovado → Monitorado
  → Comissões calculadas em Ano 0 e Anos 2,4,6,8,10
```

---

## 2. Design System

### 2.1 Tokens CSS Fundamentais (`src/index.css` — Tailwind v4 `@theme`)

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

@theme {
  /* Tipografia */
  --font-sans: 'Poppins', sans-serif;

  /* Paleta principal */
  --color-primary:    #057A8F;
  --color-background: #EEEEF1;
  --color-surface:    #FFFFFF;
  --color-foreground: #1A1A2E;
  --color-muted:      #6B7280;
  --color-success:    #16A34A;
  --color-warning:    #D97706;
  --color-danger:     #DC2626;

  /* Mapa — cores de camada */
  --map-project:  #16A34A;  /* talhões de projeto = verde */
  --map-control:  #057A8F;  /* control sites = azul pontilhado */
  --map-excluded: #9CA3AF;  /* reserva legal, APP = cinza */

  /* Superfície e sombras */
  --shadow-card:  0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
  --radius-card:  12px;
  --radius-btn:   8px;
  --radius-input: 6px;
}
```

### 2.2 Hierarquia Tipográfica (Poppins)

| Elemento | Peso | Tamanho | Uso |
|----------|------|---------|-----|
| H1 — Título de página | 700 | 2rem | Títulos principais |
| H2 — Seção | 600 | 1.5rem | Seções de tela |
| H3 — Subseção | 600 | 1.125rem | Agrupamentos dentro de seções |
| Body | 400 | 1rem | Texto corrido |
| Label/Caption | 500 | 0.875rem | Labels de inputs, badges |
| Micro / Legenda | 400 | 0.75rem | Rodapés, notas metodológicas |

### 2.3 Componentes Base (`src/components/ui/`)

Componentes construídos sobre **Radix UI** primitives com estilização Tailwind:

- `Card`, `CardHeader`, `CardContent`, `CardTitle`
- `Button` (variantes: default, outline, destructive, ghost)
- `Input`, `Label`, `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Badge` (variantes via CVA: success, warning, danger, primary, muted)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`

#### Badges de Status
```typescript
// Mapeamento de status → cor (padrão utilizado na plataforma)
const STATUS_CORES = {
  Valido:       'bg-success/10 text-success border-success/20',
  Alerta:       'bg-warning/10 text-warning border-warning/20',
  Critico:      'bg-danger/10  text-danger  border-danger/20',
  coberta:      'bg-success/10 text-success border-success/20',
  parcial:      'bg-warning/10 text-warning border-warning/20',
  descoberta:   'bg-danger/10  text-danger  border-danger/20',
}
```

### 2.4 Padrões de Layout

- **Sidebar fixa** (240px) + conteúdo principal expansível (`AuthLayout.tsx`)
- **Sidebar recolhível** em mobile com overlay
- **Largura máxima do conteúdo:** sem limitação (ocupa todo o espaço disponível)
- **Grid de cards KPI:** `grid sm:grid-cols-4 gap-4`
- **Formulários multi-step:** stepper horizontal (ex: Control Sites, Novo Lead)
- **Mapa (`FazendaMap.tsx`):** altura mínima 420px, Leaflet com OSM tiles

---

## 3. Arquitetura Técnica

### 3.1 Stack MVP (Client-Side)

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React | 19 |
| Build Tool | Vite | 8 |
| Roteamento | React Router DOM | 7 |
| Estado Global | Zustand (persist) | 5 |
| UI Primitives | Radix UI | 1.4 |
| Estilização | Tailwind CSS | 4.2 |
| Mapa | Leaflet + React-Leaflet | 1.9 / 5.0 |
| Formulários | React Hook Form + Zod | 7 / 4 |
| Ícones | Lucide React | 1.0 |
| Notificações | Sonner | 2.0 |
| Gráficos | Recharts | 3.8 |
| GeoMath | @turf/area, @turf/helpers | 7.3 |
| Utils | date-fns, uuid, axios | — |

### 3.2 Diagrama de Serviços (MVP)

```
Browser (Vite + React SPA)
  │
  ├── React Router v7 (AuthGuard por role)
  │     ├── /simulacao        → PublicLayout
  │     ├── /dashboard/*      → AuthLayout (role: produtor)
  │     ├── /parceiro/*       → AuthLayout (role: parceiro)
  │     └── /admin/*          → AuthLayout (role: admin)
  │
  ├── Zustand Store (src/store/data.ts)
  │     ├── persist() → localStorage
  │     ├── Entidades: fazendas, talhoes, leads, clientes, parceiros
  │     ├── controlSites + matchResults (Motor Matching)
  │     ├── eventosHistorico (audit log append-only)
  │     └── parametrosSistema (editáveis pelo admin)
  │
  └── Motor TypeScript (src/motor/)
        ├── lookup.ts         → Constantes IPCC / Harvest Index / NC
        ├── rothc.ts          → RothC-26.3 (5 compartimentos, iteração mensal)
        ├── n2o.ts            → N2O direto + indireto + esterco + BNF
        ├── ch4.ts            → CH4 entérico + esterco + queima
        ├── co2.ts            → CO2 combustíveis + calagem
        ├── creditos.ts       → ER + CR − LK − buffer → VCUs
        └── matchingControlSite.ts → 9 critérios VM0042 + teste-t Welch
```

### 3.3 Fluxo de Autenticação (Mock MVP)

O `src/store/auth.ts` mantém o usuário logado em memória. O `AuthGuard.tsx` redireciona caso o role não corresponda à rota. Em produção, substituir por Auth0/NextAuth/Supabase Auth.

### 3.4 Segurança e Auditoria

- Dados aprovados são **imutáveis**: `AdminHistoricoTab.tsx` implementa sistema append-only
- Cada alteração gera um `EventoHistorico` com `{ campo, valorAnterior, valorNovo, timestamp, ator }`
- O motor expõe `detalhesCalculo` completos (whitebox) para verificação por VVBs
- HTTPS obrigatório em produção; rate limiting no simulador público (futuro)

---

## 4. Modelos de Dados (Entidades)

Todas as entidades vivem em `src/store/data.ts` (TypeScript interfaces + Zustand store).

### 4.1 `Lead`

```typescript
interface Lead {
  id: string
  nome: string
  telefone: string
  email: string
  nomeFazenda?: string
  municipio?: string
  estado?: string
  areaHa?: number
  culturas?: string[]
  manejoAtual?: { tipoPreparo: string; usaCobertura: boolean; usaOrg: boolean; temPecuaria: boolean }
  praticasDesejadas?: string[]
  horizonteAnos?: 10 | 20
  receitaEstimada?: number   // R$
  tco2eEstimado?: number
  status: 'novo' | 'em_analise' | 'aprovado' | 'contratado' | 'recusado'
  motivoRecusa?: string
  parceiroId?: string
  criadoEm: string
  atualizadoEm: string
}
```

### 4.2 `Cliente` (Produtor aprovado)

```typescript
interface Cliente {
  id: string
  leadId?: string
  nome: string
  email: string
  telefone?: string
  cpfCnpj?: string
  statusConta: 'ativo' | 'inativo'
  criadoEm: string
}
```

### 4.3 `Fazenda`

```typescript
interface Fazenda {
  id: string
  clienteId: string
  nome: string
  municipio: string
  estado: string
  areaTotalHa?: number
  kmlUrl?: string
  zonaClimaticaIpcc?: 'tropical_umido' | 'tropical_seco'
  ecorregiaoWwf?: string
  criadoEm: string
}
```

### 4.4 `Talhao` (Unidade de Quantificação)

```typescript
interface Talhao {
  id: string
  fazendaId: string
  nome: string
  areaHa: number
  tipo: 'projeto' | 'control_site' | 'excluido'
  // Coordenadas (centroide — para mapa)
  latCenter?: number
  lngCenter?: number
  // Solo (laudo laboratorial)
  socPercent?: number       // % carbono orgânico
  bdGCm3?: number           // densidade aparente
  argilaPercent?: number    // % argila
  profundidadeCm?: number   // default 30
  pontosColetados?: number  // número de pontos coletados (VT0009)
  // Classificação solo
  grupoSoloFao?: string     // WRB FAO
  texturaFao?: string       // classe textural FAO
  topografia?: string       // plano|suave_ondulado|...
  // Clima (12 meses Jan-Dez)
  tempMensal?: number[]     // °C
  precipMensal?: number[]   // mm
  evapMensal?: number[]     // mm
  // Status
  dadosValidados?: boolean
  validadoEm?: string
}
```

### 4.5 `ColetaSolo` (entrada de dados laboratoriais por talhão)

```typescript
interface ColetaSolo {
  id: string
  fazendaId: string
  talhaoNome: string
  pontosColetados: number
  profundidade: string      // texto livre, ex: "0-30 cm"
  socPercent: number        // resultado laboratorial
  bdGCm3: number
  criadoEm: string
}
```

### 4.6 `DadosManejoAnual` (por talhão, por ano agrícola)

```typescript
interface DadosManejoAnual {
  id: string
  talhaoId: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto'
  // Lavoura
  cultura?: string
  dataPlantio?: string
  dataColheita?: string
  produtividade?: number
  unidadeProd?: 'sacas_ha' | 't_ha'
  usaIrrigacao?: boolean
  tipoIrrigacao?: string
  queimaResiduos?: boolean
  residuoCampo?: boolean
  // Fertilizantes
  fertilizantesSint?: FertilizanteSint[]   // [{tipo, qtdKgHa, usaInibidor}]
  fertilizantesOrg?: FertilizanteOrg[]     // [{tipo, qtdTHa}]
  calcario?: Calcario[]                     // [{tipo, qtdTHa}]
  // Operações
  operacoes?: OperacaoMec[]                // [{operacao, combustivel, litros}]
  // Pecuária
  pecuaria?: RegistroPecuaria[]            // [{tipoAnimal, quantidade, mesesNaArea, ...}]
  // Auditoria
  status: 'rascunho' | 'pendente' | 'aprovado' | 'correcao'
  versao: number
  submetidoEm?: string
  aprovadoEm?: string
}
```

### 4.7 `ResultadoMotor`

```typescript
interface ResultadoMotor {
  id: string
  talhaoId: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto' | 'delta'
  // RothC (SOC)
  socBaselineTcHa?: number
  socProjetoTcHa?: number
  deltaSocTcHa?: number
  co2SocTco2eHa?: number
  // N2O
  n2oBaselineTco2eHa?: number
  n2oProjetoTco2eHa?: number
  deltaN2oTco2eHa?: number
  // CH4
  ch4BaselineTco2eHa?: number
  ch4ProjetoTco2eHa?: number
  deltaCh4Tco2eHa?: number
  // CO2
  co2FfBaselineTco2eHa?: number
  co2FfProjetoTco2eHa?: number
  co2LimeBaselineTco2eHa?: number
  co2LimeProjetoTco2eHa?: number
  // Totais
  erTTco2eHa?: number
  crTTco2eHa?: number
  lkTTco2eHa?: number
  uncCo2?: number
  uncN2o?: number
  errNetTco2eHa?: number
  bufferPoolRate?: number
  vcusEmitidosHa?: number
  vcusEmitidosTotal?: number
  // Metadados
  rodadoEm: string
  versaoMotor: string
  parametrosUsados?: Record<string, number>
  detalhesCalculo?: object   // intermediários completos (whitebox)
}
```

### 4.8 `ControlSite` (expandido VM0042 §2.1)

```typescript
type ZonaClimaticaIPCC = 'Tropical Moist' | 'Tropical Dry' | 'Warm Temperate Moist' | ...
type ClasseDeclividade = 'nearly_level' | 'gently_sloping' | 'strongly_sloping' |
                         'moderately_steep' | 'steep' | 'very_steep'
type ClasseTexturaFAO  = 'Sandy' | 'Loamy' | 'Clayey' | 'Silty' | 'Sandy Loam' | 'Clay Loam'
type AspectoCar        = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
type GestorTipo        = 'proponente' | 'parceiro' | 'externo'

interface HistoricoManejoAnual {
  ano: number
  preparo_solo: 'plantio_direto' | 'convencional' | 'conservacao'
  tipo_cultura: string
  grupo_funcional: 'gramineas' | 'leguminosas' | 'broadleaf_nao_leguminosa'
  remocao_residuos: boolean
  esterco: boolean
  composto: boolean
  irrigacao: boolean
}

interface ControlSite {
  id: string
  nome: string
  // Gestor
  gestor_nome?: string
  gestor_tipo?: GestorTipo
  status_cs?: 'Ativo' | 'Em_implantacao' | 'Inativo'
  // Geolocalização
  centroide_lat?: number
  centroide_lng?: number
  area_ha?: number
  // Geofísico (Critérios 1–6)
  zona_climatica_ipcc?: ZonaClimaticaIPCC
  ecorregiao_wwf?: string
  classe_textural_fao?: ClasseTexturaFAO
  grupo_solo_wrb?: string
  classe_declividade?: ClasseDeclividade
  aspecto_cardinal?: AspectoCar
  // Clima (Critério 7)
  precip_media_anual_mm?: number
  fonte_precip?: string
  dist_estacao_meteo_km?: number
  // SOC (Critério 8)
  soc_medio_pct?: number
  soc_ic_lower?: number     // IC 90% inferior
  soc_ic_upper?: number     // IC 90% superior
  n_amostras_soc?: number   // mínimo 3 (VM0042 §6.4)
  data_primeira_coleta?: string
  // Manejo (Critério 9)
  historico_manejo?: HistoricoManejoAnual[]
  // Vinculação
  fazendasVinculadasIds?: string[]
}
```

### 4.9 `MatchResult`

```typescript
interface MatchResult {
  id: string
  controlSiteId: string
  fazendaId: string
  calculadoEm: string
  criterios: {
    c1_distancia: boolean
    c1_distanciaKm: number
    c2_zonaClimatica: boolean
    c3_ecorregiao: boolean
    c4_texturaFao: boolean
    c5_grupoSolo: boolean
    c6_declividade: boolean
    c7_precipitacao: boolean
    c8_soc: boolean | 'pendente'
    c8_pvalor?: number
    c9_manejo: boolean
    c9_anosMatchados?: number
  }
  score: number               // 0–100 (% critérios aprovados)
  matchTotal: boolean         // true se todos 9 aprovados
  statusCobertura: 'coberta' | 'parcial' | 'descoberta'
  criteriosPendentes: string[]
}
```

### 4.10 `EventoHistorico` (auditoria append-only)

```typescript
interface EventoHistorico {
  id: string
  entidade: 'fazenda' | 'talhao' | 'dadosManejo' | 'motor'
  entidadeId: string
  acao: 'criacao' | 'edicao' | 'aprovacao' | 'motor_rodado'
  campo?: string
  valorAnterior?: unknown
  valorNovo?: unknown
  ator: string
  timestamp: string
}
```

### 4.11 `ParametroSistema` (editáveis pelo admin)

```typescript
interface ParametroSistema {
  chave: string
  valor: number
  descricao: string
  editavel: boolean
}
```

**Valores default (seed obrigatório):**

| Chave | Valor | Descrição |
|-------|-------|-----------|
| `preco_base_usd` | 20 | Preço base do crédito (USD) |
| `buffer_pool` | 0.15 | Buffer pool default (15%) |
| `gwp_ch4` | 28 | GWP CH4 IPCC AR5 |
| `gwp_n2o` | 265 | GWP N2O IPCC AR5 |
| `ef_diesel` | 0.002886 | EF CO2 diesel (tCO2e/L) |
| `ef_gasolina` | 0.002310 | EF CO2 gasolina (tCO2e/L) |
| `ef_limestone` | 0.12 | EF calcário calcítico (tC/t) |
| `ef_dolomite` | 0.13 | EF dolomita (tC/t) |
| `ef1_n2o_default` | 0.01 | EF1 N2O solos minerais |
| `ef1_n2o_inibidor` | 0.005 | EF1 N2O com inibidor |
| `ef1_n2o_umido` | 0.016 | EF1 N2O tropical úmido |
| `ef1_n2o_seco` | 0.005 | EF1 N2O tropical seco |
| `frac_gasf` | 0.11 | Frac_GASF sintéticos |
| `frac_gasf_ureia` | 0.15 | Frac_GASF ureia |
| `frac_gasm` | 0.21 | Frac_GASM orgânicos |
| `frac_leach` | 0.24 | Frac_LEACH lixiviação |
| `ef4_n2o_volat` | 0.014 | EF4 N2O volatilização |
| `ef5_n2o_leach` | 0.011 | EF5 N2O lixiviação |
| `fator_leakage` | 0.05 | Fator leakage padrão (5%) |
| `comissao_base_usd_ha` | 1.00 | Comissão base parceiro (USD/ha) |

---

## 5. Regras de Negócio e Cálculos

### 5.1 Simulador — Fórmula Principal (`/simulacao`)

```typescript
// Regra de combinação de práticas (anti-dupla contagem)
function calcularReceita(praticas: string[], hectares: number, ptax: number, horizonte: number) {
  const fatores = praticas.map(p => FATORES_SOC[p])
  const fatorMax = Math.max(...fatores)
  const demais = fatores.filter(f => f !== fatorMax)
  const fatorCombinado = demais.length > 0
    ? fatorMax + demais.reduce((a, b) => a + b, 0) * 0.30
    : fatorMax

  const preco_brl    = 20 * ptax       // preco_base_usd × PTAX
  const buffer_pool  = 0.15
  const tco2e_ano    = hectares * fatorCombinado
  const receita_anual = tco2e_ano * preco_brl * (1 - buffer_pool)
  const receita_total = receita_anual * horizonte
  return { receita_total, receita_anual, tco2e_ano, fatorCombinado }
}
```

**Tabela de fatores SOC:**

| Prática | Fator (tCO2e/ha/ano) | Faixa |
|---------|----------------------|-------|
| Plantio direto (SPD) | 2.5 | 1.5 – 3.5 |
| Plantas de cobertura | 2.0 | 1.0 – 4.0 |
| Rotação de culturas | 1.2 | 0.5 – 2.0 |
| ILPF / ILP | 3.5 | 2.0 – 6.0 |
| Reforma de pastagem | 3.0 | 2.0 – 5.0 |
| Adubação orgânica | 1.5 | 0.5 – 2.5 |
| Biológicos/inoculantes | 0.8 | 0.3 – 1.5 |
| Manejo rotacionado de pastagem | 1.8 | 1.0 – 3.0 |

### 5.2 Motor RothC-26.3 (`src/motor/rothc.ts`)

O motor itera mensalmente (passo t = 1/12 ano) para cada compartimento (DPM, RPM, BIO, HUM). O IOM não decompõe.

**Constantes de decomposição (`lookup.ts`):**
```typescript
export const K_ROTHC = { DPM: 10.0, RPM: 0.3, BIO: 0.66, HUM: 0.02 }  // ano⁻¹
```

#### 5.2.1 Decomposição Mensal (§5.3.1)
```typescript
export function decompor(Y: number, a: number, b: number, c: number, k: number) {
  const expoente = -a * b * c * k * (1 / 12)
  const Yfinal     = Y * Math.exp(expoente)
  const decomposto = Y * (1 - Math.exp(expoente))
  return { Yfinal, decomposto }
}
```

#### 5.2.2 Fator de Temperatura — `a` (§5.3.2)
```typescript
export function calcFatorA(tempC: number): number {
  return 47.9 / (1 + Math.exp(106 / (tempC + 18.27)))
}
```

#### 5.2.3 Fator de Umidade — `b` via TSMD (§5.3.3)
```typescript
export function calcFatorB(precipMm, evapMm, pctArgila, profCm, accTSMD) {
  // Max TSMD para camada 0–23 cm
  const maxTSMD_23 = -(20.0 + 1.3 * pctArgila - 0.01 * pctArgila ** 2)
  // Ajuste para profundidade real
  const maxTSMD = (maxTSMD_23 / 23) * profCm

  let newAcc = accTSMD
  if (0.75 * evapMm > precipMm) {
    newAcc = Math.max(newAcc + (precipMm - 0.75 * evapMm), maxTSMD)
  } else {
    newAcc = Math.min(newAcc + (precipMm - 0.75 * evapMm), 0)
  }

  const threshold = 0.444 * maxTSMD
  let b = newAcc >= threshold
    ? 1.0
    : 0.2 + 0.8 * (maxTSMD - newAcc) / (maxTSMD - threshold)
  return { b: Math.max(0, Math.min(b, 1)), novAccTSMD: newAcc, maxTSMD }
}
```

#### 5.2.4 Fator de Cobertura — `c` (§5.3.4)
```typescript
export function calcFatorC(mes: number, dataPlantio?: string, dataColheita?: string): number {
  if (!dataPlantio || !dataColheita) return 1.0  // solo exposto default
  const mesPlantio  = new Date(dataPlantio).getMonth()
  const mesColheita = new Date(dataColheita).getMonth()
  const mesAjust = mes % 12
  if (mesPlantio <= mesColheita) {
    return (mesAjust >= mesPlantio && mesAjust <= mesColheita) ? 0.6 : 1.0
  }
  return (mesAjust >= mesPlantio || mesAjust <= mesColheita) ? 0.6 : 1.0
}
// c = 0.6 (solo vegetado) | c = 1.0 (solo exposto)
```

#### 5.2.5 Particionamento CO2 vs BIO+HUM (§5.3.5)
```typescript
export function calcParticoes(pctArgila: number) {
  const x       = 1.67 * (1.85 + 1.60 * Math.exp(-0.0786 * pctArgila))
  const fracCO2    = x / (x + 1)
  const fracBioHum = 1 / (x + 1)
  // Do BIO+HUM formado: 46% → BIO, 54% → HUM
  return { fracCO2, fracBioHum, x }
}
```

#### 5.2.6 Razão DPM/RPM por Tipo de Input (§5.3.6)
```typescript
export const DPM_RPM = {
  agricola:             { dpm: 1.44, rpm: 1.0 },
  pastagem_nao_melhora: { dpm: 0.67, rpm: 1.0 },
  floresta:             { dpm: 0.25, rpm: 1.0 },
  fym:                  { dpm: 0.49, rpm: 0.49, hum: 0.02 },
}
// Culturas pasto (brachiaria, pastagem_brachiaria, pasto) → pastagem_nao_melhora
// Demais culturas agrícolas → agricola
```

#### 5.2.7 IOM (§5.3.7) — Falloon et al. 1998
```typescript
export function calcIOM(tocTcHa: number): number {
  return 0.049 * Math.pow(tocTcHa, 1.139)
}
```

#### 5.2.8 Input de Carbono via Harvest Index (§5.3.8)
```typescript
export const HI: Record<string, number | null> = {
  soja: 0.42, milho: 0.50, trigo: 0.40, arroz: 0.45,
  sorgo: 0.35, algodao: 0.35, cana: 0.50, cafe: 0.30,
  brachiaria: null, crotalaria: null, pastagem_brachiaria: null, pasto: null, outras: 0.40,
}
export const RAIZ_PA: Record<string, number> = {
  soja: 0.20, milho: 0.22, trigo: 0.24, arroz: 0.20, sorgo: 0.22,
  algodao: 0.20, cana: 0.15, cafe: 0.30,
  brachiaria: 1.60, crotalaria: 0.40, pastagem_brachiaria: 1.60, pasto: 1.60, outras: 0.20,
}
export const FRACAO_C_MS = 0.45  // constante IPCC

export function calcInputC(dados: DadosCulturaRothC): number {
  const yieldTHa = unidadeProd === 'sacas_ha' ? produtividade * 0.06 : produtividade
  if (hi !== null) {
    const bioAerea = (yieldTHa / hi) - yieldTHa
    const bioRaiz  = bioAerea * raizPa
    // Se remover resíduos: bioAereaEfetiva = 0; raízes sempre contribuem
    return (residuosCampo ? bioAerea : 0 + bioRaiz) * FRACAO_C_MS
  } else {
    // Pastagem sem HI: default 2.5 t MS/ha acima-solo
    return (2.5 + 2.5 * raizPa) * FRACAO_C_MS
  }
}
```

#### 5.2.9 Estoque SOC → tC/ha (§5.3.9)
```typescript
export function calcSOCstock(socPercent: number, bdGCm3: number, profCm: number): number {
  return (socPercent / 100) * bdGCm3 * (profCm / 100) * 10000
}
// Conversão SOC → CO2: delta_SOC * (44/12)
```

#### 5.2.10 Loop Principal do RothC
```typescript
// Inicialização dos compartimentos
compartimentos = {
  DPM: socAtivo * 0.01,   // 1%  do SOC ativo inicial
  RPM: socAtivo * 0.08,   // 8%
  BIO: socAtivo * 0.02,   // 2%
  HUM: socAtivo * 0.89,   // 89%
  IOM,                     // inerte
}

for (let ano = 0; ano < nAnos; ano++) {
  for (let mes = 0; mes < 12; mes++) {
    // Calcular a, b, c para o mês
    const a = calcFatorA(clima[mes].tempC)
    const { b } = calcFatorB(clima[mes].precipMm, clima[mes].evapMm, argila, profCm, accTSMD)
    const c = calcFatorC(mes, dataPlantio, dataColheita)

    // Adicionar input mensal de C
    compartimentos.DPM += (inputC / 12) * fracDPM
    compartimentos.RPM += (inputC / 12) * fracRPM

    // Decompor DPM, RPM, BIO, HUM
    let totalBioHumFormado = 0
    for (const comp of ['DPM','RPM','BIO','HUM']) {
      const { Yfinal, decomposto } = decompor(compartimentos[comp], a, b, c, K_ROTHC[comp])
      compartimentos[comp] = Yfinal
      totalBioHumFormado += decomposto * fracBioHum
    }
    compartimentos.BIO += totalBioHumFormado * 0.46
    compartimentos.HUM += totalBioHumFormado * 0.54
  }
  socPorAno.push(SUM(compartimentos))
}

const deltaSocTcHa = socFinal - socInicial
const co2Tco2eHa   = deltaSocTcHa * (44 / 12)
```

### 5.3 Módulo N2O — QA3 (`src/motor/n2o.ts`)

#### 5.3.1 N2O Total do Solo
```
N2O_total = N2O_fert_direto + N2O_fert_indireto + N2O_esterco + N2O_BNF + N2O_queima
```

#### 5.3.2 Teores N por fertilizante (`lookup.ts`)
```typescript
export const NC_SF = {
  ureia: 0.46, map: 0.11, dap: 0.18,
  sulfato_amonio: 0.21, kcl: 0.00, nitrato_calcio: 0.155, npk_formulado: 0.12,
}
export const NC_OF = {
  esterco_bovino: 0.015, cama_frango: 0.030, composto: 0.020, vinhaca: 0.003,
}
```

#### 5.3.3 N2O Direto Fertilizantes (Eq. 18-20 VM0042)
```typescript
// Seleção de EF1 conforme zona + inibidor
if (temInibidor)                    ef1 = params['ef1_n2o_inibidor'] ?? 0.005
else if (zona === 'tropical_umido') ef1 = params['ef1_n2o_umido']   ?? 0.016
else if (zona === 'tropical_seco')  ef1 = params['ef1_n2o_seco']    ?? 0.005
else                                ef1 = params['ef1_n2o_default']  ?? 0.01

totalNSint = SUM(fertSint.qtdKgHa × NC_SF[tipo])
totalNOrg  = SUM(fertOrg.qtdTHa × 1000 × NC_OF[tipo])
totalN     = totalNSint + totalNOrg

N2O_fert_direto = GWP_N2O × totalN × EF1 × (44/28) / 1000  // tCO2e/ha
```

#### 5.3.4 N2O Indireto — Volatilização e Lixiviação (Eq. 21-23)
```typescript
// Volatilização
nVolatSint = SUM(kgN_sint × (tipo === 'ureia' ? 0.15 : frac_gasf))
nVolatOrg  = totalNOrg × frac_gasm  // 0.21
N2O_volat  = GWP_N2O × (nVolatSint + nVolatOrg) × EF4 × (44/28) / 1000

// Lixiviação (apenas clima úmido ou irrigado)
fracLeach = (zona === 'tropical_umido' || usaIrrigacao) ? 0.24 : 0
N2O_leach = GWP_N2O × totalN × fracLeach × EF5 × (44/28) / 1000
// EF4 = 0.014 | EF5 = 0.011
```

#### 5.3.5 N2O por Esterco (Eq. 26-28)
```typescript
const NEX = { gado_corte_extensivo: 40, gado_leite: 70, ovinos: 12, equinos: 45 }
// AWMS_pasto = 1.0 (deposição direta em pasto)
fManure = SUM(pop × NEX[tipo] × 1.0 × (meses/12))
N2O_esterco = GWP_N2O × fManure × EF_N2O_MD × (44/28) / 1000 / areaHa
// EF_N2O_MD = 0.004 kg N2O-N / kg N
```

#### 5.3.6 N2O por Fixação Biológica (Eq. 24-25)
```typescript
const N_CONTENT = { soja: 0.030, crotalaria: 0.025, feijao: 0.028 }
const EF_BNF = 0.01
biomassaLeguminosa = calcInputC(cultura) / FRACAO_C_MS
fCrKgN = biomassaLeguminosa × N_CONTENT[cultura] × 1000
N2O_BNF = GWP_N2O × fCrKgN × EF_BNF × (44/28) / 1000
```

### 5.4 Módulo CH4 — QA3 (`src/motor/ch4.ts`)

#### 5.4.1 CH4 Entérico (Eq. 11)
```typescript
export const ANIMAL_PARAMS = {
  gado_corte_extensivo:    { ef_ent: 56, nex: 40, vs_rate: 2.9 },
  gado_corte_semi:         { ef_ent: 63, nex: 40, vs_rate: 2.9 },
  gado_corte_confinamento: { ef_ent: 68, nex: 40, vs_rate: 2.9 },
  gado_leite:              { ef_ent: 83, nex: 70, vs_rate: 3.5 },
  ovinos:                  { ef_ent:  5, nex: 12, vs_rate: 0.5 },
  caprinos:                { ef_ent:  5, nex: 12, vs_rate: 0.4 },
  equinos:                 { ef_ent: 18, nex: 45, vs_rate: 3.5 },
}
ch4Total = SUM(pop × EF_ent[tipo])   // kg CH4/ano
CH4_ent  = (GWP_CH4 × ch4Total) / (1000 × areaHa)  // tCO2e/ha
```

#### 5.4.2 CH4 Esterco em Pasto (Eq. 12-13)
```typescript
// EF_CH4_MD = 1.0 kg CH4/cabeça/ano (pasto)
ch4Esterco = SUM(pop × vsRate × 365 × EF_CH4_MD / 1000)
CH4_md = (GWP_CH4 × ch4Esterco) / (1000 × areaHa)
```

#### 5.4.3 CH4 Queima de Biomassa (Eq. 14)
```typescript
// CF_RESIDUOS = 0.80 | EF_CH4_BB = 2.7 g CH4/kg MS
bioAerea = calcInputC(cultura) / FRACAO_C_MS    // t MS/ha
mb       = bioAerea × CF_RESIDUOS               // massa queimada
ch4Kg    = mb × 1000 × EF_CH4_BB / 1000        // kg CH4/ha
CH4_bb   = (GWP_CH4 × ch4Kg) / 1000            // tCO2e/ha
```

### 5.5 Módulo CO2 — Combustíveis e Calagem (`src/motor/co2.ts`)

#### 5.5.1 CO2 Combustíveis (Eq. 52 VM0042)
```typescript
export const EF_COMBUSTIVEL = {
  diesel:   0.002886,  // tCO2e/litro
  gasolina: 0.002310,
  etanol:   0.0,
}
CO2_ff = SUM(litros × EF_COMBUSTIVEL[combustivel])  // /ha
```

#### 5.5.2 CO2 Calagem (Eq. 53 VM0042)
```typescript
// EF_limestone = 0.12 tC/t | EF_dolomite = 0.13 tC/t | Gesso = 0
EL = SUM(
  calcarios.map(c =>
    c.tipo === 'calcitico'  ? c.qtdTHa × 0.12 × (44/12) :
    c.tipo === 'dolomitico' ? c.qtdTHa × 0.13 × (44/12) : 0
  )
)
CO2_lime = EL / areaHa  // tCO2e/ha
```

### 5.6 Cálculo Final de Créditos Líquidos (`src/motor/creditos.ts`)

#### 5.6.1 ER_t — Reduções de Emissão (Eq. 37 VM0042)
```typescript
// UNC padrão (VMD0053 simplificado)
uncCo2 = hasLaudoSolo ? 0.065 : 0.150  // 6.5% com laudo, 15% sem
uncN2o = 0.15  // 15% IPCC Tier 1

// Conservadorismo aplicado por componente:
parcelas = [
  { componente: 'ΔCO₂ Combustíveis', deltaLiquido: deltaCO2Ff },            // sem UNC
  { componente: 'ΔCO₂ Calagem',      deltaLiquido: deltaCO2Lime },          // sem UNC
  { componente: 'ΔCH₄ Entérico',     deltaLiquido: deltaCH4Ent  × (1 - uncCo2) },
  { componente: 'ΔCH₄ Esterco',      deltaLiquido: deltaCH4Md   × (1 - uncCo2) },
  { componente: 'ΔCH₄ Queima',       deltaLiquido: deltaCH4Bb },            // sem UNC
  { componente: 'ΔN₂O Solo',         deltaLiquido: deltaN2oSoil × (1 - uncN2o) },
  { componente: 'ΔN₂O Queima',       deltaLiquido: deltaN2oBb },            // sem UNC
]
ER_t = SUM(parcelas[].deltaLiquido)
```

#### 5.6.2 CR_t — Remoções de CO2 (Eq. 40)
```typescript
deltaCO2SocNet = deltaCO2SocWp - deltaCO2SocBsl  // projeto − baseline
I   = deltaCO2SocNet > 0 ? 1 : -1
CR_t = deltaCO2SocNet × (1 - uncCo2 × I)
```

#### 5.6.3 LK_t — Leakage (VMD0054)
```typescript
fpds = hasPecuaria ? fator_leakage × 1.5 : fator_leakage  // fator_leakage default 0.05
LK_t = (MAX(ER_t, 0) + MAX(CR_t, 0)) × fpds
```

#### 5.6.4 VCUs Emitidos
```typescript
ERR_net_t      = ER_t + CR_t - LK_t
VCUs_ha        = ERR_net_t > 0 ? ERR_net_t × (1 - buffer_pool) : 0
VCUs_total     = VCUs_ha × areaHa
// buffer_pool: valor de parametrosSistema['buffer_pool'] (default 0.15)
```

### 5.7 Cálculo de Comissões (Parceiro)

```typescript
// Ano 0 (contratação)
comissao_ano_0 = area_elegivel_ha × 1.00 × PTAX_venda_dia  // R$

// Anos 2, 4, 6, 8, 10 (após verificação de créditos)
G_medio = media(vcus_emitidos_ha, anos_anteriores)  // tCO2e/ha/ano
Pm = (G_medio / 2) × 1.00 × area_elegivel_ha × PTAX_venda_dia  // R$
```

### 5.8 Conservadorismo na Seleção de EFs (VM0042 §8.6.3)

| Direção da emissão | Regra |
|-------------------|-------|
| Emissões **diminuem** (projeto < baseline) | Usar EF que resulte na **MENOR redução** |
| Emissões **aumentam** (projeto > baseline) | Usar EF que resulte na **MAIOR emissão** |

---

## 6. Módulo Control Sites — VM0042 §8.2

### 6.1 Requisitos Mínimos de Cobertura

| Parâmetro | Exigência | Ação da Plataforma |
|-----------|-----------|-------------------|
| Mínimo absoluto | ≥ 3 control sites ativos | Alerta vermelho + bloqueio de verificação |
| Mínimo por estrato | ≥ 1 control site por estrato | Alerta de validação |
| Recomendado | ≥ 10 control sites | Alerta amarelo |
| Distância | ≤ 250 km das QUs | Haversine automático (C1) |
| Topografia | Mesma classe de declive | C6 + aspecto se ≥ 30% |
| Textura do solo | Mesma classe FAO | C4 |
| SOC comparável | Estatisticamente indistinguível | C8: teste-t Welch α=0.10 |
| Histórico de manejo | Mesmas práticas 5 anos | C9: grupos funcionais VMD0053 |

### 6.2 Motor de Matching — 9 Critérios (`src/motor/matchingControlSite.ts`)

#### Critério 1 — Distância Haversine (≤ 250 km)
```typescript
function haversine(lat1, lng1, lat2, lng2): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)
          * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}
c1 = haversine(cs.lat, cs.lng, farm.lat, farm.lng) <= 250
```

#### Critério 2 — Zona Climática IPCC
```typescript
c2 = cs.zona_climatica_ipcc === farm.zonaClimaticaIpcc
```

#### Critério 3 — Ecorregião WWF
```typescript
c3 = cs.ecorregiao_wwf === farm.ecorregiaoWwf
```

#### Critério 4 — Textura FAO (0–30 cm)
```typescript
c4 = cs.classe_textural_fao === farm.texturaFao
```

#### Critério 5 — Grupo Solo WRB
```typescript
c5 = cs.grupo_solo_wrb === farm.grupoSoloWrb
```

#### Critério 6 — Declividade e Aspecto
```typescript
const STEEP = ['moderately_steep', 'steep', 'very_steep']
const ASPECT_DEG = { N:0, NE:45, E:90, SE:135, S:180, SW:225, W:270, NW:315 }

c6 = cs.classe_declividade === farm.declividade
// Se declividade ≥ moderately_steep: também verificar aspecto
if (c6 && STEEP.includes(cs.classe_declividade)) {
  const diff = Math.abs(ASPECT_DEG[cs.aspecto_cardinal] - ASPECT_DEG[farm.aspecto])
  c6 = Math.min(diff, 360 - diff) <= 30  // tolerância 30°
}
```

#### Critério 7 — Precipitação (|Δ| ≤ 100 mm/ano)
```typescript
c7 = Math.abs(cs.precip_media_anual_mm - farm.precipMm) <= 100
```

#### Critério 8 — SOC: Teste-t Bilateral de Welch (α = 0.10)
```typescript
// IC 90% → derivar SD do CS
const tCrit = cs.n >= 30 ? 1.645 : cs.n >= 10 ? 1.812 : cs.n >= 5 ? 2.132 : 2.776
const seCs  = (cs.soc_ic_upper - cs.soc_ic_lower) / (2 * tCrit)
const sdCs  = seCs * Math.sqrt(cs.n)

// Welch t-statistic
const se1   = sdCs**2 / cs.n
const se2   = sdFarm**2 / farm.n
const tStat = Math.abs((cs.soc_medio_pct - farm.socMedia) / Math.sqrt(se1 + se2))
// df Welch-Satterthwaite
const df = (se1 + se2)**2 / (se1**2/(cs.n-1) + se2**2/(farm.n-1))

// p-valor bilateral (aproximação Lanczos + beta incompleta)
const pvalor = approxPValue(tStat, df)
c8 = pvalor > 0.10  // PASS se p > α (SOC indistinguível)
```

#### Critério 9 — Histórico de Manejo (5 anos, VMD0053)
```typescript
// Compara os 5 anos mais recentes em comum
for (const ano of anosComuns.slice(0, 5)) {
  const match =
    hCs.preparo_solo    === hFarm.preparo_solo &&
    hCs.grupo_funcional === hFarm.grupo_funcional &&
    hCs.remocao_residuos === hFarm.remocao_residuos &&
    hCs.esterco          === hFarm.esterco &&
    hCs.composto         === hFarm.composto &&
    hCs.irrigacao        === hFarm.irrigacao
  if (match) anosMatchados++
}
c9 = anosMatchados === Math.min(anosComuns.length, 5)
```

#### Score e Classificação
```typescript
const passCount = [c1,c2,c3,c4,c5,c6,c7,c8===true,c9].filter(Boolean).length
const score = Math.round((passCount / 9) * 100)

// Cobertura parcial: geofísico OK (C1–C7), mas C8 ou C9 falhos
const geofisicoOk = [c1,c2,c3,c4,c5,c6,c7].every(Boolean)
statusCobertura =
  passCount === 9 ? 'coberta' :
  geofisicoOk     ? 'parcial' : 'descoberta'
```

### 6.3 Visualização no Mapa (`FazendaMap.tsx`)

- **Círculo pontilhado azul:** raio de 250 km em torno do centroide do CS (cobertura geofísica estimada)
- **Marcador da fazenda:** cor dinâmica por status de cobertura
  - 🟢 Verde (`#16A34A`) — coberta (9/9 critérios)
  - 🟡 Laranja (`#D97706`) — parcial (geofísico OK, SOC/manejo pendente)
  - 🔴 Vermelho (`#DC2626`) — descoberta

---

## 7. Perfis de Usuário e Permissões

| Ação | Lead | Produtor | Parceiro | Admin |
|------|:----:|:--------:|:--------:|:-----:|
| Acessar simulador | ✅ | ✅ | ✅ | ✅ |
| Ver próprio dashboard MRV | ❌ | ✅ | ❌ | ✅ |
| Inserir dados de manejo | ❌ | ✅ | ❌ | ✅ |
| Submeter dados para validação | ❌ | ✅ | ❌ | ✅ |
| Cadastrar leads | ❌ | ❌ | ✅ | ✅ |
| Ver painel parceiro | ❌ | ❌ | ✅ | ✅ |
| Validar/aprovar dados MRV | ❌ | ❌ | ❌ | ✅ |
| Cadastrar talhões e solo | ❌ | ❌ | ❌ | ✅ |
| Cadastrar control sites | ❌ | ❌ | ❌ | ✅ |
| Rodar motor de cálculos | ❌ | ❌ | ❌ | ✅ |
| Editar parâmetros do sistema | ❌ | ❌ | ❌ | ✅ |
| Ver histórico de auditoria | ❌ | ❌ | ❌ | ✅ |
| Ver todos os projetos | ❌ | ❌ | ❌ | ✅ |

---

## 8. Jornada 1 — Simulador de Leads

**URL:** `/simulacao` · Pública, sem login. Implementado em `src/pages/simulador/`.

### 8.1 Tela 1 — Gate de Cadastro
Coleta nome, telefone e email antes de exibir resultados. Cria `Lead` no store com `status = 'novo'`.

### 8.2 Tela 2 — Área da Propriedade
- **Upload KML:** Processado com `@turf/area`, renderizado em mapa Leaflet (`--map-project`)
- **Entrada manual:** campo `areaHa` numérico

### 8.3 Tela 3 — Cultura e Manejo Atual
Coleta: culturas, tipo de preparo, uso de cobertura, adubação orgânica, pecuária. Alimenta a árvore de elegibilidade:
```
SE (plantio_direto + usa_cobertura + usa_org)
  → Exibir aviso de elegibilidade limitada (additionality)
```

### 8.4 Tela 4 — Práticas Desejadas (Cálculo em Tempo Real)
Layout: checkboxes à esquerda + card de resultado ao vivo à direita. Usa `calcularReceita()` a cada mudança. Seletor de horizonte (10/20 anos).

### 8.5 Tela 5 — Resultado
Exibe `receita_total` em destaque, gráfico de barras Recharts por ano, CTAs WhatsApp e cadastro.

---

## 9. Jornada 2 — MRV Digital (Cliente)

**URL:** `/dashboard` · Requer login `produtor`. Implementado em `src/pages/cliente/`.

### 9.1 Dashboard Principal
- Barra de progresso de completude (% das 6 categorias preenchidas)
- Mapa Leaflet da fazenda (talhões clicáveis)
- Card de projeção financeira (últimos VCUs calculados)
- Painel de alertas/pendências

### 9.2 Seção MRV — Dados de Lavoura, Pecuária, Fertilização, Operações
Formulários por talhão / ano agrícola. Dados salvos como `DadosManejoAnual` com `status: 'rascunho'`.

### 9.3 Fluxo de Aprovação
```
Rascunho → [Submeter] → Pendente → Admin aprova → Aprovado (imutável)
                                 → Admin solicita correção → Correcao
```

### 9.4 Visualização de Resultados (`ResultadosPage.tsx`)
Exibe `ResultadoMotor` com gráfico de VCUs por ano e breakdown por fonte de emissão.

---

## 10. Jornada 3 — Painel do Parceiro

**URL:** `/parceiro` · Requer login `parceiro`. Implementado em `src/pages/parceiro/`.

- **Dashboard:** KPIs (leads, ha, comissão projetada vs recebida), ranking anônimo
- **Novo Lead (`NovoLeadPage.tsx`):** formulário multi-passo com upload de KML opcional
- **Lista de Leads (`LeadsPage.tsx`):** status com badges, comissão projetada
- **Comissões (`ComissoesPage.tsx`):** tabela com Ano 0 + Anos 2,4,6,8,10 e fórmula `G_medio`
- **Ranking (`RankingPage.tsx`):** posição relativa anônima

---

## 11. Jornada 4 — Painel Admin (Venture Carbon)

**URL:** `/admin` · Requer login `admin`. Implementado em `src/pages/admin/`.

### 11.1 Dashboard Admin (`AdminDashboard.tsx`)
KPIs: funil de leads (novo/análise/aprovado/recusado), VCUs emitidos, pipeline, alertas de validação pendente.

### 11.2 Gestão de Fazendas e Talhões
- `AdminFazendas.tsx`: CRUD de fazendas
- `AdminFazendaDetalhe.tsx`: mapa + abas (Talhões, Dados Climáticos, Histórico)
- `AdminTalhoesTab.tsx`: grid de talhões com campos SOC%, BD, pontos coletados; tabela "Coleta de Solo por Talhão" (editável, alimenta C8 do matching)

### 11.3 Validação de Dados MRV (`AdminValidacaoMRV.tsx`)
Fila de submissões `status: 'pendente'`. Admin aprova (trava dado) ou solicita correção com comentário.

### 11.4 Control Sites (`AdminControlSites.tsx`)
- **Dashboard:** KPIs (sites ativos, fazendas cobertas/descobertas), alertas automáticos VM0042
- **Lista:** tabela com metadados, score, fazendas vinculadas
- **Matching:** seleção CS + Fazenda → exibe resultado critério a critério com p-valor C8
- **Stepper de Cadastro:** 6 etapas — Identificação, Geofísico, Clima, SOC, Manejo, Vinculação

### 11.5 Motor de Cálculos (`AdminMotor.tsx`)
- Seleção de talhão + ano + cenário (Baseline / Projeto)
- Botão "Executar Motor" → `rodarMotorCompleto()` síncrono
- Resultados em accordions hierárquicos: RothC → N2O → CH4 → CO2 → Créditos
- Todos os intermediários expostos (whitebox) para auditoria
- Exportação em `.CSV` com detalhes de cálculo

### 11.6 Parâmetros do Sistema (`AdminParametros.tsx`)
Tabela editável com todos os `ParametroSistema`. Campos não editáveis bloqueados com label "Constante metodológica".

### 11.7 Histórico de Auditoria (`AdminHistoricoTab.tsx`)
Lista append-only de todos os `EventoHistorico` de uma fazenda. Exibe campo, valor anterior, valor novo, ator e timestamp.

---

## 12. Motor de Cálculos (TypeScript Client-Side)

### 12.1 Estrutura de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `lookup.ts` | Constantes IPCC, HI, RAIZ_PA, NC_SF, NC_OF, ANIMAL_PARAMS, K_ROTHC, EF_ |
| `rothc.ts` | RothC-26.3 completo (5 compartimentos, iteração mensal, intermediários) |
| `n2o.ts` | N2O direto + indireto + esterco + BNF + queima |
| `ch4.ts` | CH4 entérico + esterco + queima de biomassa |
| `co2.ts` | CO2 combustíveis (por operação) + calagem (por tipo) |
| `creditos.ts` | ER + CR − LK − buffer → VCUs (com UNC e conservadorismo) |
| `matchingControlSite.ts` | 9 critérios VM0042 + Haversine + Welch t-test + histórico manejo |
| `index.ts` | `rodarMotorCompleto()` — orquestrador geral |

### 12.2 Orquestrador (`src/motor/index.ts`)

```typescript
function rodarMotorCompleto({ talhao, manejo, clima, params, areaHa }) {
  // 1. RothC — Baseline
  const rothcBsl = rodarRothC(talhao, manejo.baseline, clima, nAnos)
  // 2. RothC — Projeto
  const rothcWp  = rodarRothC(talhao, manejo.projeto,  clima, nAnos)
  // 3. N2O — Baseline e Projeto
  const n2oBsl   = calcularN2O(manejo.baseline, zona, irrigacao, params, areaHa)
  const n2oWp    = calcularN2O(manejo.projeto,  zona, irrigacao, params, areaHa)
  // 4. CH4 — Baseline e Projeto
  const ch4Bsl   = calcularCH4(manejo.baseline, params, areaHa)
  const ch4Wp    = calcularCH4(manejo.projeto,  params, areaHa)
  // 5. CO2 — Baseline e Projeto
  const co2Bsl   = calcularCO2(manejo.baseline, params)
  const co2Wp    = calcularCO2(manejo.projeto,  params)
  // 6. Deltas (baseline − projeto = redução)
  const deltas = {
    deltaCO2Ff:    co2Bsl.co2FfTco2eHa   - co2Wp.co2FfTco2eHa,
    deltaCO2Lime:  co2Bsl.co2LimeTco2eHa - co2Wp.co2LimeTco2eHa,
    deltaCH4Ent:   ch4Bsl.ch4EntericoTco2eHa - ch4Wp.ch4EntericoTco2eHa,
    deltaN2oSoil:  n2oBsl.n2oTotalTco2eHa    - n2oWp.n2oTotalTco2eHa,
    deltaCO2SocWp:  rothcWp.co2Tco2eHa,
    deltaCO2SocBsl: rothcBsl.co2Tco2eHa,
    ...
  }
  // 7. Créditos líquidos
  const creditos = calcularCreditos(deltas, areaHa, params, hasLaudoSolo, hasPecuaria)
  // 8. Retorno com detalhesCalculo (whitebox)
  return { rothcBsl, rothcWp, n2oBsl, n2oWp, ch4Bsl, ch4Wp, co2Bsl, co2Wp, creditos }
}
```

### 12.3 Periodicidade de Monitoramento

| Parâmetro | Frequência |
|-----------|-----------|
| Dados de manejo (ALM) | Anual |
| Medição SOC | A cada 5 anos (mínimo) — QA1 e QA2 |
| Dados climáticos | Mensal (manual ou API) |
| Verificação de créditos (VVB) | A cada 1–5 anos |
| Baseline reassessment | A cada 10 anos (recomendado: 5) |
| Fatores de emissão | A cada 5 anos |

---

## 13. Integrações Externas

### 13.1 BCB — API PTAX (Taxa de Câmbio)

```
GET https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/
    CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='MM-DD-YYYY'&$format=json
```

- Buscar diariamente às 13h (após fechamento PTAX)
- MVP: valor hardcoded + badge "Câmbio estimado"
- Produção: cache Redis 24h, usar `cotacaoVenda`

### 13.2 INMET / ERA5 (Dados Climáticos)

- **Hierarquia de fontes (SPEC §5):** INMET (≤ 50 km) → ERA5-Land (~9 km) → NASA POWER (~55 km)
- MVP: entrada manual dos 12 meses de temp, precipitação e evaporação pelo admin
- Produção: job mensal consumindo API meteo

### 13.3 SoilGrids (Dados de Solo)

- Textura FAO (0–30 cm) e grupo WRB para Control Sites e Fazendas
- MVP: manual pelo admin
- Produção: API REST SoilGrids v2 com coordenadas do centroide

### 13.4 MapBiomas / PostGIS (Fase Futura)

- Cobertura histórica do solo (50 anos) para validação de additionality
- Poligonização real de KMLs e cálculo de overlap
- Digital Soil Mapping (VT0014)

---

## 14. Fases de Implementação (Status Atual)

| Fase | Descrição | Status |
|------|-----------|--------|
| 0 — Fundação | Vite + React + Zustand + Design System | ✅ Concluída |
| 1 — Simulador | Jornada pública 5 telas + cálculo em tempo real | ✅ Concluída |
| 2 — Admin Base | CRUD fazendas/talhões, gestão leads, parâmetros | ✅ Concluída |
| 3 — Dashboard Produtor | MRV digital, submissão, aprovação | ✅ Concluída |
| 4 — Motor TypeScript | RothC + N2O + CH4 + CO2 + Créditos + Auditoria | ✅ Concluída |
| 5 — Control Sites | 9 critérios VM0042, teste-t Welch, dashboard, mapa 250km | ✅ Concluída |
| 6 — Parceiro | Dashboard, novo lead, comissões, ranking | ✅ Concluída |
| 7 — Backend Real | PostgreSQL + PostGIS, APIs externas, autenticação | ⬜ Futuro |
| 8 — Produção | CI/CD, monitoring, testes E2E, hardening | ⬜ Futuro |

---

## Apêndice A — Lookup Tables Completas

### A.1 Harvest Index e Razão Raiz:Parte Aérea

```typescript
// src/motor/lookup.ts
export const HI      = { soja: 0.42, milho: 0.50, trigo: 0.40, arroz: 0.45, sorgo: 0.35,
                          algodao: 0.35, cana: 0.50, cafe: 0.30, brachiaria: null,
                          crotalaria: null, pastagem_brachiaria: null, pasto: null, outras: 0.40 }
export const RAIZ_PA = { soja: 0.20, milho: 0.22, trigo: 0.24, arroz: 0.20, sorgo: 0.22,
                          algodao: 0.20, cana: 0.15, cafe: 0.30, brachiaria: 1.60,
                          crotalaria: 0.40, pastagem_brachiaria: 1.60, pasto: 1.60, outras: 0.20 }
export const N_CONTENT = { soja: 0.030, crotalaria: 0.025, feijao: 0.028 }
```

### A.2 Fertilizantes Sintéticos — NC_SF e Frac_GASF

```typescript
export const NC_SF = {
  ureia: 0.46, map: 0.11, dap: 0.18, sulfato_amonio: 0.21,
  kcl: 0.00, nitrato_calcio: 0.155, npk_formulado: 0.12,
}
export const FRAC_GASF = { ureia: 0.15, _default: 0.11 }
```

### A.3 Fertilizantes Orgânicos — NC_OF

```typescript
export const NC_OF = {
  esterco_bovino: 0.015, cama_frango: 0.030, composto: 0.020, vinhaca: 0.003,
}
```

### A.4 Parâmetros Animais IPCC

```typescript
export const ANIMAL_PARAMS = {
  gado_corte_extensivo:    { ef_ent: 56, nex: 40, vs_rate: 2.9 },
  gado_corte_semi:         { ef_ent: 63, nex: 40, vs_rate: 2.9 },
  gado_corte_confinamento: { ef_ent: 68, nex: 40, vs_rate: 2.9 },
  gado_leite:              { ef_ent: 83, nex: 70, vs_rate: 3.5 },
  ovinos:                  { ef_ent:  5, nex: 12, vs_rate: 0.5 },
  caprinos:                { ef_ent:  5, nex: 12, vs_rate: 0.4 },
  equinos:                 { ef_ent: 18, nex: 45, vs_rate: 3.5 },
}
```

### A.5 Constantes do Motor

```typescript
export const K_ROTHC     = { DPM: 10.0, RPM: 0.3, BIO: 0.66, HUM: 0.02 }  // ano⁻¹
export const FRACAO_C_MS = 0.45    // fração de carbono na matéria seca
export const CF_RESIDUOS = 0.80    // fração de combustão de resíduos (IPCC Table 2.6)
export const EF_CH4_BB   = 2.7    // g CH4 / kg MS queimada
export const EF_N2O_BB   = 0.07   // g N2O / kg MS queimada
export const EF_N2O_MD   = 0.004  // kg N2O-N / kg N (esterco em pasto)
export const EF_CH4_MD   = 1.0    // kg CH4 / cabeça / ano (esterco em pasto)
export const EF_COMBUSTIVEL = { diesel: 0.002886, gasolina: 0.002310, etanol: 0.0 }
export const DPM_RPM = {
  agricola:             { dpm: 1.44, rpm: 1.0 },
  pastagem_nao_melhora: { dpm: 0.67, rpm: 1.0 },
  floresta:             { dpm: 0.25, rpm: 1.0 },
  fym:                  { dpm: 0.49, rpm: 0.49, hum: 0.02 },
}
```

---

## Apêndice B — Notas Metodológicas Obrigatórias

1. **Hierarquia de EFs (VM0042 §8.6.3):** Preferência: (1) fator projeto-específico peer-reviewed → (2) Tier 2 fonte alternativa → (3) Tier 2 derivado dos dados → (4) Tier 1 IPCC 2019. Admin pode sobrescrever via `AdminParametros.tsx` com campo de justificativa.

2. **Período de baseline:** Fixado ex ante. Reavaliação obrigatória a cada 10 anos (recomendada a cada 5). A plataforma suporta múltiplos períodos via `cenario: 'baseline'` em `DadosManejoAnual`.

3. **Incerteza (VMD0053):** Implementação simplificada no MVP: `UNC = 6.5%` com laudo solo / `15%` sem laudo. Em produção: `UNC = (√s² / delta_medio) × 100 × t_0.667` onde `t_0.667 ≈ 0.4307`.

4. **VCUs emitidos:** `VCUs = ERR_net × (1 − buffer_pool)`. Buffer definido pelo AFOLU Non-Permanence Risk Tool (10–20%). Configurável em `parametrosSistema.buffer_pool`.

5. **Dados de Solo para C8:** O critério 8 (SOC, teste-t Welch) requer mínimo de 3 amostras laboratoriais no CS e na Fazenda. Os dados de coleta são inseridos via `AdminTalhoesTab.tsx` (tabela "Coleta de Solo por Talhão") e alimentam este critério.

6. **Fases futuras (fora do MVP atual):** Integração direta MapBiomas, app mobile nativo, WhatsApp API, automação QGIS, Digital Soil Mapping (VT0014), backend real (PostgreSQL + PostGIS + Redis + BullMQ).

---

*Documento gerado a partir da análise completa do código-fonte do MVP (Vite/React/Zustand/TypeScript) cruzada com o Manual Técnico V2 e a Especificação Técnica do Módulo Control Sites. Avril 2026.*
