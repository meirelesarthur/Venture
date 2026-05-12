# Venture Carbon — Guia de Desenvolvimento
> Sistema Web Responsivo · React 19 · VM0042 v2.2 · RothC-26.3
> Versão 5.0 · Maio 2026 · Confidencial

---

## Índice

1. [Design System](#1-design-system)
2. [Arquitetura e Stack](#2-arquitetura-e-stack)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Perfis de Usuário](#4-perfis-de-usuário)
5. [Rotas do Sistema](#5-rotas-do-sistema)
6. [Estado Global — Zustand Store](#6-estado-global--zustand-store)
7. [Tipos e Entidades](#7-tipos-e-entidades)
8. [Fluxo 1 — Simulador (Lead)](#8-fluxo-1--simulador-lead)
9. [Fluxo 2 — MRV Digital (Cliente)](#9-fluxo-2--mrv-digital-cliente)
10. [Fluxo 3 — Painel do Parceiro](#10-fluxo-3--painel-do-parceiro)
11. [Fluxo 4 — Admin Venture Carbon](#11-fluxo-4--admin-venture-carbon)
12. [Motor de Cálculos — Arquitetura](#12-motor-de-cálculos--arquitetura)
13. [Motor de Cálculos — Módulo RothC](#13-motor-de-cálculos--módulo-rothc)
14. [Motor de Cálculos — Módulo N₂O](#14-motor-de-cálculos--módulo-n₂o)
15. [Motor de Cálculos — Módulo CH₄](#15-motor-de-cálculos--módulo-ch₄)
16. [Motor de Cálculos — Módulo CO₂](#16-motor-de-cálculos--módulo-co₂)
17. [Cálculo de Créditos Líquidos](#17-cálculo-de-créditos-líquidos)
18. [Fórmulas do Simulador](#18-fórmulas-do-simulador)
19. [Painel do Parceiro — Comissões](#19-painel-do-parceiro--comissões)
20. [Control Sites e Baseline](#20-control-sites-e-baseline)
21. [Motor de Matching — 9 Critérios VM0042](#21-motor-de-matching--9-critérios-vm0042)
22. [Componentes de Mapa](#22-componentes-de-mapa)
23. [Banco de Fatores e Constantes](#23-banco-de-fatores-e-constantes)
24. [Parâmetros Globais do Sistema](#24-parâmetros-globais-do-sistema)
25. [Inputs por Perfil e Tela](#25-inputs-por-perfil-e-tela)
26. [Regras de Negócio Gerais](#26-regras-de-negócio-gerais)
27. [Changelog V4 → V5](#27-changelog-v4--v5)

---

## 1. Design System

### Tokens Fundamentais

```css
/* Tipografia */
font-family: 'Poppins', sans-serif;
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

/* Paleta */
--color-primary:    #057A8F;   /* destaque, CTAs, links ativos */
--color-background: #EEEEF1;   /* fundo geral de páginas */
--color-surface:    #FFFFFF;   /* cards, modais, painéis */
--color-text:       #1A1A2E;   /* texto principal */
--color-muted:      #6B7280;   /* labels, placeholders */
--color-success:    #16A34A;
--color-warning:    #D97706;
--color-danger:     #DC2626;

/* Mapa — cores de área */
--map-project:      #16A34A;   /* talhões de projeto = verde */
--map-control:      #057A8F;   /* control sites = azul (primário) */
--map-excluded:     #9CA3AF;   /* reserva legal, APP = cinza */
```

### Hierarquia Tipográfica (Poppins)

| Elemento | Peso | Tamanho |
|----------|------|---------|
| H1 — Título de página | 700 | 2rem |
| H2 — Seção | 600 | 1.5rem |
| H3 — Subseção | 600 | 1.125rem |
| Body | 400 | 1rem |
| Label/Caption | 500 | 0.875rem |
| Micro / Legenda | 400 | 0.75rem |

### Componentes Base (shadcn/ui + Radix UI)

- **Botão primário:** `bg-primary text-white rounded-xl font-semibold` — cor `#057A8F`
- **Botão secundário:** `border border-primary/30 text-primary hover:bg-primary/5`
- **Input:** `border border-border/60 focus:border-primary rounded-xl`
- **Card:** `bg-surface rounded-2xl shadow-sm border border-border/50` — **sem `py-6` na raiz**
  - `CardHeader`: recebe `pt-6` | `CardContent`: recebe `pb-6` | `CardFooter`: recebe `pb-6`
- **Badge de status:** pill com cores semânticas via `mrv-status-badge`, `lead-status-badge`, `cliente-status-badge`
- **Toasts:** `sonner` com `toast.success()`, `toast.error()`
- **Animação de entrada:** `animate-in fade-in slide-in-from-bottom-4 duration-500`

### Padrão de Card (ARQUITETURAL — CRÍTICO)

O componente `src/components/ui/card.tsx` **não possui `py-6` na raiz**. O padding é distribuído nos sub-componentes:

```tsx
// CORRETO — padding apenas nos sub-componentes
<Card>
  <CardHeader>   {/* pt-6 pb-4 */}
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>  {/* pb-6 */}
    conteúdo
  </CardContent>
</Card>

// INCORRETO — nunca adicionar p-0 como workaround
<Card className="p-0"> ← NUNCA
```

---

## 2. Arquitetura e Stack

### Stack Frontend (Atual — Produção)

| Camada | Tecnologia | Versão | Observação |
|--------|-----------|--------|------------|
| Runtime/Build | Vite | 8.0.1 | ESM, HMR rápido |
| Linguagem | TypeScript | 5.9.3 | Strict mode |
| Framework | React | 19.2.4 | Concurrent features, hooks |
| Roteamento | React Router | 7.13.2 | V7 (sem `<Switch>`) |
| Estado Global | Zustand | 5.0.12 | `persist` middleware no localStorage |
| Estilização | Tailwind CSS | 4.2.2 | Utility-first + CVA |
| UI Primitivos | Radix UI | 1.4.3 | Headless, acessível |
| Ícones | Lucide React | 1.11.0 | SVG treeshakeable |
| Mapas | MapLibre GL | 5.24.0 | Tiles vetoriais open-source |
| Desenho de polígonos | Mapbox GL Draw | 1.5.1 | Integrado ao MapLibre |
| Formulários | React Hook Form | 7.72.0 | Eficiente, sem re-renders |
| Validação | Zod | 4.3.6 | Schema + inferência de tipos |
| Animações | Framer Motion | 12.38.0 | Transições de página/componente |
| Toasts | Sonner | 2.0.7 | Toast queue declarativo |
| Gráficos | Recharts | 3.8.0 | Gráficos de barra/linha |
| Análise espacial | @turf/area, @turf/helpers | 7.3.4 | Cálculo de área de polígono KML |
| Conversão KML | @tmcw/togeojson | 7.1.2 | KML → GeoJSON |
| HTTP | Axios | 1.13.6 | Para futuras integrações API |
| Datas | date-fns | 4.1.0 | Manipulação de datas |
| IDs | uuid | 13.0.0 | Geração de UUIDs v4 |
| Panels | react-resizable-panels | 4.10.0 | Painéis ajustáveis (admin MRV) |
| Temas | next-themes | 0.4.6 | Dark/Light mode |

### Motor de Cálculos (Frontend — TypeScript)

O Motor RothC + GHG roda **100% no frontend** em TypeScript puro. Não há backend ativo no MVP — todos os cálculos são executados na aba do navegador via `src/motor/`.

```
src/motor/
├── index.ts               ← Orquestrador principal (rodarMotorCompleto)
├── rothc.ts               ← RothC-26.3 (SOC mensal)
├── n2o.ts                 ← IPCC Tier 2 N₂O
├── ch4.ts                 ← CH₄ entérico + esterco + queima
├── co2.ts                 ← CO₂ combustíveis (Eq.6-7) + calagem (Eq.8-9)
├── creditos.ts            ← ER/CR/LK → VCUs líquidos
├── matchingControlSite.ts ← 9 critérios VM0042 matching
└── lookup.ts              ← Tabelas de referência (EF, GWP, HI, etc.)
```

### Boas Práticas React (Enforçadas no Projeto)

- Componentes funcionais + hooks exclusivamente
- Separação estrita: `pages/`, `components/`, `motor/`, `store/`, `constants/`, `lib/`
- Cálculos do simulador executados no frontend em tempo real (sem chamada API)
- Motor RothC + GHG também no frontend — callback `onProgress(step, percent)` para UX
- Lazy loading de rotas com `React.lazy` + `Suspense`
- Mapas isolados em componentes próprios com cleanup de instância no `useEffect` de retorno
- Dados numéricos sensíveis formatados com `Intl.NumberFormat` ou `.toLocaleString('pt-BR')`
- Importar apenas os ícones usados de `lucide-react` (treeshaking essencial)
- **Nunca** usar `git add -A` em commit — verificar `.env` e binários antes

### Integrações Externas (Planejadas / Parcialmente Ativas)

| Serviço | Dado | Frequência | Status |
|---------|------|-----------|--------|
| API BCB (Banco Central) | `PTAX_venda_dia` (R$/USD) | Diária | Planejado — fallback `5.65` hardcoded |
| INMET / estação ≤50km | Temp, precipitação, evaporação mensais | Mensal | Manual (Admin insere) |
| CartoDB (Tile Server) | Tiles vetoriais `light_all` | Contínuo | **Ativo** — AdminDashboard map |
| OpenStreetMap | Tiles raster base | Contínuo | **Ativo** — FazendaMap |
| MapBiomas | Histórico de cobertura | — | **Fase futura** |

---

## 3. Estrutura de Arquivos

```
venture-carbon/
├── src/
│   ├── App.tsx                          ← Todas as rotas (React Router v7)
│   ├── main.tsx                         ← Entry point Vite
│   │
│   ├── store/
│   │   ├── data.ts                      ← Zustand store (estado + ~80 actions)
│   │   ├── types.ts                     ← 25+ interfaces de entidade
│   │   ├── auth.ts                      ← Contexto de autenticação
│   │   └── initial-data.ts             ← 22 fazendas mock + 47 parâmetros
│   │
│   ├── motor/
│   │   ├── index.ts                     ← rodarMotorCompleto() orquestrador
│   │   ├── rothc.ts                     ← RothC-26.3 SOC mensal
│   │   ├── n2o.ts                       ← N₂O IPCC Tier 2 (Eq.16-28 VM0042)
│   │   ├── ch4.ts                       ← CH₄ entérico + esterco + queima
│   │   ├── co2.ts                       ← CO₂ Eq.6-7 combustíveis + Eq.8-9 calagem
│   │   ├── creditos.ts                  ← ER/CR/LK → VCUs
│   │   ├── matchingControlSite.ts       ← 9 critérios VM0042
│   │   └── lookup.ts                    ← Tabelas EF, GWP, HI, DPM/RPM
│   │
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminClientes.tsx
│   │   │   ├── AdminClienteDetalhe.tsx
│   │   │   ├── AdminLeads.tsx
│   │   │   ├── AdminFazendas.tsx
│   │   │   ├── AdminFazendaDetalhe.tsx
│   │   │   ├── AdminValidacaoMRV.tsx
│   │   │   ├── AdminControlSites.tsx
│   │   │   ├── AdminControlSiteForm.tsx
│   │   │   ├── AdminControlSiteDetalhe.tsx
│   │   │   ├── AdminMotor.tsx
│   │   │   ├── AdminParametros.tsx
│   │   │   ├── AdminParceiros.tsx
│   │   │   └── AdminUsers.tsx
│   │   │   └── components/
│   │   │       ├── motor/
│   │   │       │   ├── MotorEquations.tsx
│   │   │       │   └── MotorSections.tsx  ← Seções: RothC, N₂O, CH₄, CO₂, Créditos
│   │   │       └── ...
│   │   ├── parceiro/
│   │   ├── cliente/
│   │   ├── simulador/
│   │   └── auth/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── maps/
│   │   └── layouts/
│   │
│   ├── constants/
│   │   ├── simulador.ts
│   │   └── climaticos.ts
│   │
│   └── lib/
│       ├── utils.ts
│       └── rothc-simulator.ts
│
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── DevGuideV5.md                        ← Este documento
```

---

## 4. Perfis de Usuário

### 4.1 Lead (não autenticado)
Acessa apenas `/simulacao`. Resultado exibe estimativa de receita e CTA para criar conta ou falar com consultor.

### 4.2 Cliente (Produtor Rural)
Usuário autenticado que representa uma fazenda. Submete dados de lavoura, pecuária, fertilização e operações para o MRV.

**Permissões:**
- Leitura e edição dos próprios dados **antes** da aprovação do Admin
- Visualização de VCUs estimados, timeline e histórico
- Upload de documentos e KML
- Não pode aprovar, travar ou alterar dados após submissão

### 4.3 Parceiro
Usuário autenticado que indica leads. Tem painel de acompanhamento de comissões e ranking.

### 4.4 Admin (Equipe Venture Carbon)
Usuário interno com acesso total ao sistema.

**Permissões:**
- Aprovar, rejeitar ou solicitar correção de qualquer dado MRV
- Travar dados validados (imutáveis com timestamp + ID admin)
- Inserir dados de solo (laudo), climáticos e de campo
- Cadastrar e gerenciar control sites + executar matching automático
- Editar parâmetros globais (preço USD, buffer pool, EFs)
- Substituir EF default por fator projeto-específico (fonte + justificativa obrigatórios)
- Disparar motor de cálculos e visualizar resultados detalhados com **todos os intermediários de equação**

---

## 5. Rotas do Sistema

```
/                            → Redirect baseado em role autenticado

/* PÚBLICO */
/simulacao                   → SimuladorPage — wizard 7 steps (Lead)
/login                       → LoginPage (GuestGuard)
/recuperar-senha             → RecuperarSenhaPage
/criar-conta                 → CriarContaPage

/* CLIENTE (role: cliente) */
/dashboard                   → DashboardPage
/dashboard/mrv/*             → MrvPage — tabs: mapa+KML, lavoura, pecuária,
                               fertilização, operacional, documentos
/dashboard/resultados        → ResultadosPage
/dashboard/perfil            → PerfilPage

/* PARCEIRO (role: parceiro) */
/parceiro                    → ParceiroDashboard
/parceiro/leads/novo         → NovoLeadPage
/parceiro/leads              → LeadsPage
/parceiro/comissoes          → ComissoesPage
/parceiro/ranking            → RankingPage

/* ADMIN (role: admin) */
/admin                       → AdminDashboard
/admin/clientes              → AdminClientes
/admin/clientes/:id          → AdminClienteDetalhe
/admin/leads                 → AdminLeads
/admin/parceiros             → AdminParceiros
/admin/fazendas              → AdminFazendas
/admin/fazendas/:fazendaId   → AdminFazendaDetalhe
/admin/validacao             → AdminValidacaoMRV
/admin/control-sites         → AdminControlSites
/admin/control-sites/novo    → AdminControlSiteForm
/admin/control-sites/:id     → AdminControlSiteDetalhe
/admin/motor/:fazendaId?     → AdminMotor — runner + resultados detalhados
/admin/parametros            → AdminParametros
/admin/usuarios              → AdminUsers
```

---

## 6. Estado Global — Zustand Store

**Arquivo:** `src/store/data.ts`
**Middleware:** `persist` com `localStorage`, versão numérica para invalidação de cache.

> **CRÍTICO:** Ao alterar o `initialState()`, **incremente a `version`** do persist para forçar `migrate: () => initialState()`.

### Arrays de Estado

```typescript
leads: Lead[]
clientes: Cliente[]
fazendas: Fazenda[]
talhoes: Talhao[]
manejo: DadosManejoAnual[]
comissoes: Comissao[]
controlSites: ControlSite[]
matchResults: MatchResult[]
parceiros: Parceiro[]
parametros: ParametroSistema[]
resultadosMotor: ResultadoMotor[]
dadosClimaticos: DadoClimatico[]
notificacoes: Notificacao[]
alertas: Alerta[]
usuarios: Usuario[]
coletasSolo: ColetaSolo[]
historicoFazendas: EventoHistorico[]
```

### Actions Disponíveis (resumo)

```typescript
// Leads
addLead / updateLeadStatus / convertLeadToCliente

// Fazendas & Talhões
addFazenda / updateFazenda / addTalhao / updateTalhao

// MRV
saveManejoRascunho / updateManejo / submitManejo / approveManejo / requestCorrection

// Motor
addResultadoMotor / clearResultadosTalhao

// Parâmetros
setParametro(chave, valor, fonte?) / getParam(chave)

// Utilitário
resetToInitialData()
```

---

## 7. Tipos e Entidades

**Arquivo:** `src/store/types.ts`

### Lead, Fazenda, Talhao, DadosManejoAnual, ControlSite, MatchResult
*(sem alterações em relação à V4 — ver seção 7 do DevGuideV4 para detalhes completos)*

### ResultadoMotor

```typescript
interface ResultadoMotor {
  id: string
  talhaoId: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto'
  rodadoEm: string
  versaoMotor: string
  parametrosUsados: Record<string, number>

  // RothC — SOC
  socBaselineTcHa: number
  socProjetoTcHa: number
  deltaSocTcHa: number
  co2SocTco2eHa: number             // delta × (44/12)

  // N₂O
  n2oBaselineTco2eHa: number
  n2oProjetoTco2eHa: number
  deltaN2oTco2eHa: number

  // CH₄
  ch4BaselineTco2eHa: number
  ch4ProjetoTco2eHa: number
  deltaCh4Tco2eHa: number

  // CO₂ direto
  co2FfTco2eHa: number              // combustíveis fósseis (Eq.7 aggregate)
  co2LimeTco2eHa: number            // calagem (Eq.9 aggregate)

  // VCUs
  erTTco2eHa: number                // Emission Reduction (Eq.37)
  crTTco2eHa: number                // Carbon Removal (Eq.40)
  lkTTco2eHa: number                // Leakage (VMD0054)
  uncCo2: number                    // incerteza SOC
  uncN2o: number                    // incerteza N₂O
  errNetTco2eHa: number             // ER + CR − LK − incerteza
  bufferPoolRate: number
  vcusEmitidosHa: number
  vcusEmitidosTotal: number

  detalhesCalculo: DetalhesCalculo  // TODOS os intermediários de cada equação
}
```

---

## 8. Fluxo 1 — Simulador (Lead)

*(sem alterações em relação à V4)*

**URL pública:** `/simulacao` | Wizard 7 steps | 100% frontend.

### Fórmula (ver seção 18 para detalhes)

```
receita_anual = SUM(hectares × fator_SOC[pratica_i]) × preco_credito_BRL × (1 - buffer_pool)
receita_total = receita_anual × horizonte_anos
```

---

## 9. Fluxo 2 — MRV Digital (Cliente)

*(sem alterações em relação à V4 — ver seção 9 do DevGuideV4 para detalhes de inputs)*

---

## 10. Fluxo 3 — Painel do Parceiro

*(sem alterações em relação à V4)*

---

## 11. Fluxo 4 — Admin Venture Carbon

*(sem alterações em relação à V4)*

---

## 12. Motor de Cálculos — Arquitetura

**Arquivo principal:** `src/motor/index.ts`
**Função principal:** `rodarMotorCompleto(talhao, manejoProj, manejoBase, dadoClimatico, parametros, onProgress?)`

### Sequência de Execução

```
1. RothC Baseline   → rothc.ts   (§5.3 VM0042 / RothC-26.3)
2. RothC Projeto    → rothc.ts
3. N₂O Baseline     → n2o.ts    (Eq.16–28 VM0042)
4. N₂O Projeto      → n2o.ts
5. CH₄ Baseline     → ch4.ts    (Eq.11–14 VM0042)
6. CH₄ Projeto      → ch4.ts
7. CO₂ Projeto      → co2.ts    (Eq.6–9 VM0042 — desagregado por tipo)
8. Créditos         → creditos.ts (Eq.37, 40, 74 VM0042 + VMD0053/0054)
```

### Tipos de Intermediários Expostos (`DetalhesCalculo`)

Todos os intermediários de equação são exportados em `detalhesCalculo` para auditoria, visualização no painel admin e exportação CSV.

```typescript
export interface DetalhesCalculo {
  rothcBase:  RothCIntermediarios
  rothcProj:  RothCIntermediarios
  n2oProj:    N2OProjIntermediarios
  n2oBase:    N2OBaseIntermediarios
  ch4Proj:    CH4ProjIntermediarios
  ch4Base:    CH4BaseIntermediarios
  co2Proj:    CO2ProjIntermediarios   // inclui co2ByFuelType + co2ByLimeType (v5)
  co2Base:    CO2BaseIntermediarios
  creditos:   CreditosIntermediarios
}
```

#### RothCIntermediarios

```typescript
interface RothCIntermediarios {
  // §5.3.9 — Inicialização
  socTotal:     number    // SOC_stock (tC/ha) = (SOC%/100) × BD × prof × 100
  iom:          number    // IOM (tC/ha) = 0.049 × TOC^1.139
  socAtivo:     number    // SOC_stock − IOM

  // §5.3.8 — Input de Carbono Vegetal
  inputC:       number    // tC/ha/ano = (bioAerea + bioRaiz) × 0.45
  hiUsado:      number    // Harvest Index da cultura
  raizPa:       number    // Razão raiz/parte aérea
  bioAerea:     number    // t MS/ha
  bioRaiz:      number    // t MS/ha
  yieldTHa:     number    // produtividade convertida em t MS/ha

  // §5.3.6 — DPM/RPM
  fracDPM:      number    // fração do pool DPM
  fracRPM:      number    // fração do pool RPM
  tipoInput:    string    // 'agricola' | 'pastagem_nao_melhora' | 'floresta'
  dpmRpmRatio:  number    // DPM/RPM numérico

  // §5.3.5 — Particionamento por % Argila
  xParticao:    number    // x = 1.67 × (1.85 + 1.60 × exp(-0.0786 × %argila))
  fracCO2:      number    // x / (x + 1)
  fracBioHum:   number    // 1 / (x + 1)

  // §5.3.2 — Fator Temperatura (mês 1 — referência)
  fatorA_mes1:  number    // 47.9 / (1 + exp(106 / (T + 18.27)))
  tempC_mes1:   number    // °C

  // §5.3.3 — Fator Umidade TSMD (mês 1 — referência)
  fatorB_mes1:  number
  maxTSMD:      number    // -(20.0 + 1.3 × argila - 0.01 × argila²) × (prof/23)

  // §5.3.4 — Fator Cobertura
  fatorC_mes1:  number    // 0.6 (vegetado) | 1.0 (exposto)

  // §5.3.1 — Constantes k e Compartimentos Finais
  k_DPM:        number    // 10.0 ano⁻¹
  k_RPM:        number    // 0.3 ano⁻¹
  k_BIO:        number    // 0.66 ano⁻¹
  k_HUM:        number    // 0.02 ano⁻¹
  compFinalDPM: number    // tC/ha
  compFinalRPM: number    // tC/ha
  compFinalBIO: number    // tC/ha
  compFinalHUM: number    // tC/ha
  compFinalIOM: number    // tC/ha

  // Conversão Final
  deltaSoc:     number    // tC/ha acumulado
  co2Eq:        number    // tCO₂e/ha = deltaSoc × (44/12)
  socPorAno:    number[]  // série histórica SOC
}
```

#### N2OProjIntermediarios

```typescript
interface N2OProjIntermediarios {
  // Eq.18-20 — Emissão Direta
  ef1Usado:        number    // EF1 selecionado (zona + inibidor)
  zonaClimatica:   string
  temInibidor:     boolean
  totalNSint:      number    // kg N/ha — fertilizantes sintéticos
  totalNOrg:       number    // kg N/ha — fertilizantes orgânicos
  totalNFert:      number    // kg N/ha — total combinado
  n2oDireto:       number    // tCO₂e/ha

  // Eq.21-23 — Emissão Indireta
  nVolatSint:      number    // kg N/ha volatilizado de sintéticos
  nVolatOrg:       number    // kg N/ha volatilizado de orgânicos
  nVolatTotal:     number    // kg N/ha
  fracGasf:        number    // Frac_GASF usado (0.11 padrão | 0.15 ureia) ← v5
  fracGasm:        number    // Frac_GASM usado (0.21) ← v5
  ef4:             number    // EF4 = 0.014 kg N₂O-N / kg N
  n2oVolat:        number    // tCO₂e/ha — sub-total volatilização
  nLeachTotal:     number    // kg N/ha lixiviado
  fracLeach:       number    // 0.24 (úmido/irrigado) | 0 (seco)
  ef5:             number    // EF5 = 0.011 kg N₂O-N / kg N
  n2oLeach:        number    // tCO₂e/ha — sub-total lixiviação

  // Eq.26-28 — Esterco
  fManure:         number    // kg N/ha depositado
  efEsterco:       number    // EF_N₂O_md = 0.004
  n2oEsterco:      number    // tCO₂e/ha

  // Eq.24-25 — BNF
  bioMassaLeg:     number    // t MS/ha biomassa leguminosa
  nContent:        number    // tN/tMS da cultura
  fCrBnf:          number    // kg N/ha fixado
  efBnf:           number    // 0.01
  n2oBnf:          number    // tCO₂e/ha

  // Eq.16 — Total
  n2oTotal:        number    // tCO₂e/ha = direto + volat + leach + esterco + BNF
}
```

#### CO2ProjIntermediarios ← **ATUALIZADO V5**

```typescript
interface CO2ProjIntermediarios {
  // Eq.6 — CO₂ por tipo de combustível (desagregado)
  efDiesel:        number                    // tCO₂/L
  efGasolina:      number                    // tCO₂/L
  detalhesCombust: DetalheCombustivel[]      // por operação: litros × EF = CO₂
  co2ByFuelType:   Record<string, number>    // Eq.6: { diesel: X, gasolina: Y, ... }

  // Eq.7 — CO₂ combustíveis total (aggregate)
  co2Ff:           number                    // tCO₂e/ha = Σ co2ByFuelType

  // Eq.8 — CO₂ por tipo de corretivo (desagregado)
  efCalcitico:     number                    // 0.12 tC/t
  efDolomitico:    number                    // 0.13 tC/t
  fatorCCO2:       number                    // 44/12 = 3.6667
  co2ByLimeType:   Record<string, number>    // Eq.8: { calcitico: X, dolomitico: Y }
  detalhesCalc:    DetalheCal[]              // por aplicação: qtd × EF × (44/12)

  // Eq.9 — CO₂ calagem total (aggregate)
  co2Lime:         number                    // tCO₂e/ha = Σ co2ByLimeType
}
```

---

## 13. Motor de Cálculos — Módulo RothC

> RothC-26.3 — Quantification Approach 1 (SOC) | VM0042 §5.3
> Arquivo: `src/motor/rothc.ts`
> Executa mensalmente para cada talhão em dois cenários: Baseline e Projeto.

### 13.1 Decomposição Mensal de Compartimento (§5.3.1)

```
Y_final = Y × exp(-a × b × c × k × t)

Material decomposto no mês = Y × (1 - exp(-a × b × c × k × t))

Onde:
  Y = estoque atual no compartimento (tC/ha)
  a = fator de temperatura  (§13.3)
  b = fator de umidade TSMD (§13.4)
  c = fator de cobertura    (§13.5)
  k = constante de decomposição (ano⁻¹) — ver tabela §13.2
  t = 1/12 (passo mensal FIXO — CONSTANTE)
```

O material decomposto de cada compartimento (DPM, RPM, BIO, HUM) é **reparticionado**:
- `frac_CO₂ = x / (x + 1)` → perdido como CO₂ para atmosfera
- `frac_BioHum = 1 / (x + 1)` → retido, redistribuído:
  - `46%` do BioHum formado → compartimento BIO
  - `54%` do BioHum formado → compartimento HUM
- IOM: k = 0, não decompõe nunca

### 13.2 Constantes de Decomposição (k)

| Compartimento | Descrição | k (ano⁻¹) |
|---------------|-----------|-----------|
| `k_DPM` | Material vegetal decomponível | **10.0** |
| `k_RPM` | Material vegetal resistente | **0.3** |
| `k_BIO` | Biomassa microbiana | **0.66** |
| `k_HUM` | Matéria orgânica humificada | **0.02** |
| `k_IOM` | Matéria orgânica inerte | **0** (não decompõe) |

### 13.3 Fator de Temperatura — a (§5.3.2)

```
a = 47.9 / (1 + exp(106 / (T + 18.27)))

Onde:
  T = temperatura média mensal (°C) — INPUT_ADMIN / API INMET
  Constantes 47.9, 106, 18.27 são fixas do modelo RothC original (Coleman & Jenkinson, 1996)
```

### 13.4 Fator de Umidade — b via TSMD (§5.3.3)

**5 passos sequenciais:**

**Passo 1 — Max TSMD para 0–23cm:**
```
Max_TSMD_23cm = -(20.0 + 1.3 × %argila - 0.01 × %argila²)
```

**Passo 2 — Ajuste para profundidade real do talhão:**
```
Max_TSMD = (Max_TSMD_23cm / 23) × profundidade_cm
```

**Passo 3 — Bare Soil Moisture Deficit:**
```
BareSMD = Max_TSMD / 1.8
```

**Passo 4 — Acumular TSMD mensalmente:**
```
A cada mês:
  Se (0.75 × evaporacao_mm) > precipitacao_mm:
    Acc_TSMD += (precipitacao_mm - 0.75 × evaporacao_mm)
    Acc_TSMD = max(Acc_TSMD, Max_TSMD)   // não ultrapassa Max_TSMD

  Quando precipitacao_mm > 0.75 × evaporacao_mm:
    Solo reidrata → Acc_TSMD = 0
```

**Passo 5 — Calcular fator b:**
```
Se Acc_TSMD >= 0.444 × Max_TSMD:
  b = 1.0   (solo úmido — sem restrição)
Caso contrário:
  b = 0.2 + (1.0 - 0.2) × (Max_TSMD - Acc_TSMD) / (Max_TSMD - 0.444 × Max_TSMD)
```

### 13.5 Fator de Cobertura do Solo — c (§5.3.4)

```
c = 0.6  → solo vegetado (entre dataPlantio e dataColheita — INPUT_PRODUTOR)
c = 1.0  → solo exposto

Sistema monta vetor[12] de c automaticamente a partir das datas de plantio/colheita.
```

### 13.6 Particionamento CO₂ vs (BIO+HUM) por %Argila (§5.3.5)

```
x = 1.67 × (1.85 + 1.60 × exp(-0.0786 × %argila))

Fração perdida como CO₂    = x / (x + 1)
Fração retida como BIO+HUM = 1 / (x + 1)

Do BIO+HUM formado no mês:
  46% → acumulado no compartimento BIO
  54% → acumulado no compartimento HUM
```

### 13.7 Razão DPM/RPM por Tipo de Input Vegetal (§5.3.6)

| Tipo de Vegetal | DPM/RPM | DPM% | RPM% |
|-----------------|---------|------|------|
| Culturas agrícolas / pastagem melhorada | 1.44 | 59% | 41% |
| Pastagem não melhorada / savana | 0.67 | 40% | 60% |
| Floresta decídua/tropical | 0.25 | 20% | 80% |
| FYM (esterco/compostagem) | — | 49% | 49% + 2% HUM direto |

Determinação automática: culturas como Brachiaria/pastagem → `pastagem_nao_melhora`; demais → `agricola`.

### 13.8 IOM — Matéria Orgânica Inerte (§5.3.7 — Falloon et al., 1998)

```
IOM (tC/ha) = 0.049 × TOC^1.139

Onde:
  TOC = carbono orgânico total do solo (tC/ha) = SOC_stock total
  Expoente 1.139 e coeficiente 0.049 — constantes de Falloon et al. (1998)
```

### 13.9 Input de Carbono Vegetal via Harvest Index (§5.3.8)

```
biomassa_parte_aerea (t MS/ha) = (Yield_tMS_ha / HI) - Yield_tMS_ha
   = Yield_tMS_ha × (1 - HI) / HI

biomassa_raizes (t MS/ha) = biomassa_parte_aerea × razao_raiz_parte_aerea

input_C_total (tC/ha/ano) = (biomassa_parte_aerea + biomassa_raizes) × 0.45

Onde:
  Yield_tMS_ha = produtividade em t MS/ha (convertido de sacas/ha se necessário)
  HI           = Harvest Index — LOOKUP por cultura (seção 23.3)
  razao_raiz_PA= Raiz:Parte Aérea — LOOKUP por cultura (seção 23.3)
  0.45         = fração de C na matéria seca vegetal (CONSTANTE IPCC)
```

> **Para pastagens** (Brachiaria): HI = null → toda a biomassa aérea é considerada residual + razão raiz:PA = 1.60 (alta contribuição de carbono subterrâneo).

### 13.10 Estoque de SOC — Inicialização do Modelo (§5.3.9)

```
SOC_stock (tC/ha) = (SOC% / 100) × BD × (profundidade_cm / 100) × 10.000

Equivalente a:
SOC_stock = (SOC% / 100) × BD (Mg/m³) × profundidade_m × 10.000 m²/ha

Onde:
  SOC%         = % C orgânico — INPUT_ADMIN (laudo ISO/IEC 17025)
  BD           = densidade aparente (g/cm³ = Mg/m³) — INPUT_ADMIN
  profundidade = cm (mínimo 30cm recomendado, mínimo absoluto 30cm)
  10.000       = m²/ha
```

> ⚠️ **CRÍTICO:** SOC%, BD e profundidade são os inputs de maior impacto no modelo. Coleta: ISO 18400-104.

### 13.11 Conversão SOC → CO₂e (Final)

```
CR_t_bruto (tCO₂e/ha) = delta_SOC (tC/ha) × (44 / 12)

Onde:
  delta_SOC = SOC_final - SOC_inicial (positivo = remoção de carbono = crédito)
  44/12     = 3.6667 — razão de massa molecular CO₂/C (CONSTANTE)
```

---

## 14. Motor de Cálculos — Módulo N₂O

> VM0042 v2.2 — Equações 16–28 | IPCC 2019 Tier 2
> Arquivo: `src/motor/n2o.ts`

### 14.1 N₂O Total do Solo (Eq. 16)

```
N2O_soil = N2O_fert_direct + N2O_volat + N2O_leach + N2O_esterco + N2O_BNF

(tCO₂e/ha)
```

### 14.2 N₂O por Fertilizantes — Emissão Direta (Eq. 17–19)

**Passo 1 — N total de fertilizantes sintéticos (Eq. 19):**
```
FSN (kg N/ha) = Σ (M_SF_i × NC_SF_i)

Onde:
  M_SF_i  = quantidade do fertilizante sintético i (kg/ha) — INPUT_PRODUTOR
  NC_SF_i = teor de N no fertilizante i (fração) — LOOKUP lookup.ts
```

**Passo 2 — N total de fertilizantes orgânicos (Eq. 20):**
```
FON (kg N/ha) = Σ (M_OF_i × 1000 × NC_OF_i)

Onde:
  M_OF_i  = quantidade do fertilizante orgânico i (t/ha) — INPUT_PRODUTOR
  1000    = conversão t → kg
  NC_OF_i = teor de N no material orgânico i (fração) — LOOKUP lookup.ts
```

**Passo 3 — N₂O direto total (Eq. 18):**
```
N2O_fert_direct (tCO₂e/ha) = GWP_N₂O × (FSN + FON) × EF1 × (44/28) / 1000

Onde:
  GWP_N₂O = 265 (CONSTANTE — IPCC AR5, req. Verra)
  EF1     = ver tabela abaixo (seleção por zona climática + inibidor)
  44/28   = 1.5714 — conversão N₂O-N → N₂O (razão molecular)
  1000    = conversão kg → t
```

**Fatores EF1 por condição:**

| Condição | EF1 (kg N₂O-N / kg N) | Chave |
|----------|-----------------------|-------|
| Solo mineral — default | **0.01** | `ef1_n2o_default` |
| Com inibidor de nitrificação | **0.005** | `ef1_n2o_inibidor` |
| Tropical úmido (>1000mm/ano) | **0.016** | `ef1_n2o_umido` |
| Tropical seco (<1000mm/ano) | **0.005** | `ef1_n2o_seco` |

### 14.3 N₂O — Emissão Indireta (Eq. 21–23)

**Passo 1 — N volatilizado de sintéticos:**
```
N_volat_sint (kg N/ha) = FSN × Frac_GASF

Frac_GASF = 0.15 se ureia; 0.11 para demais sintéticos
```

**Passo 2 — N volatilizado de orgânicos:**
```
N_volat_org (kg N/ha) = FON × Frac_GASM

Frac_GASM = 0.21 (CONSTANTE — IPCC 2019)
```

**Passo 3 — N₂O por volatilização (Eq. 22):**
```
N2O_volat (tCO₂e/ha) = GWP_N₂O × (N_volat_sint + N_volat_org) × EF4 × (44/28) / 1000

EF4 = 0.014 kg N₂O-N / kg (NH₃-N + NOx-N) — CONSTANTE IPCC 2019
```

**Passo 4 — N lixiviado total:**
```
N_leach (kg N/ha) = (FSN + FON) × Frac_LEACH

Frac_LEACH = 0.24  → clima úmido (>1000mm) OU usa irrigação
Frac_LEACH = 0     → clima seco SEM irrigação
```

**Passo 5 — N₂O por lixiviação (Eq. 23):**
```
N2O_leach (tCO₂e/ha) = GWP_N₂O × N_leach × EF5 × (44/28) / 1000

EF5 = 0.011 kg N₂O-N / kg N lixiviado — CONSTANTE IPCC 2019
```

> **V5 — Transparência aumentada:** `Frac_GASF` e `Frac_GASM` agora são expostos explicitamente no intermediário `N2OProjIntermediarios.fracGasf` e `.fracGasm`, exibidos no painel admin e no CSV exportado.

### 14.4 N₂O por Deposição de Esterco (Eq. 26–28)

**Passo 1 — N depositado por animais (Eq. 28):**
```
F_manure (kg N/ha) = Σ (Pop_l × Nex_l × AWMS_pasto × MS_l) / Ai

Onde:
  Pop_l   = número de animais do tipo l — INPUT_PRODUTOR
  Nex_l   = excreção anual de N (kg N/cab/ano) — LOOKUP por espécie
  AWMS    = 1.0 para pastejo direto (100% depositado na área)
  MS_l    = fração do ano na área = meses_na_area / 12
  Ai      = área do talhão (ha)
```

**Valores Nex por tipo de animal:**

| Animal | Nex (kg N/cab/ano) |
|--------|-------------------|
| Gado corte | 40 |
| Gado leite | 70 |
| Ovinos | 12 |
| Equinos | 35 |

**Passo 2 — N₂O do esterco (Eq. 26):**
```
N2O_esterco (tCO₂e/ha) = GWP_N₂O × F_manure × EF_N₂O_md × (44/28) / 1000

EF_N₂O_md = 0.004 kg N₂O-N / kg N — CONSTANTE IPCC 2019
```

### 14.5 N₂O por Fixação Biológica de Nitrogênio (Eq. 24–25)

**Passo 1 — N fixado pela cultura leguminosa (Eq. 25):**
```
F_CR_BNF (kg N/ha) = biomassa_leguminosa (t MS/ha) × N_content × 1000

Onde:
  N_content (tN/tMS) — LOOKUP por cultura (soja=0.030, crotalária=0.025, feijão=0.028)
```

**Passo 2 — N₂O da fixação biológica (Eq. 24):**
```
N2O_BNF (tCO₂e/ha) = GWP_N₂O × F_CR_BNF × EF_BNF × (44/28) / 1000

EF_BNF = 0.01 kg N₂O-N / kg N fixado — CONSTANTE IPCC 2019
```

---

## 15. Motor de Cálculos — Módulo CH₄

> VM0042 v2.2 — Equações 11–14 | IPCC AR5 GWP_CH₄ = 28
> Arquivo: `src/motor/ch4.ts`

### 15.1 CH₄ por Fermentação Entérica (Eq. 11)

```
CH4_ent (tCO₂e/ha) = (GWP_CH₄ × Σ (Pop_l × EF_ent_l)) / (1000 × Ai)

Onde:
  GWP_CH₄ = 28 (CONSTANTE — IPCC AR5, req. Verra)
  Pop_l   = animais do tipo l — INPUT_PRODUTOR
  EF_ent_l= fator de emissão entérica por tipo/sistema (kg CH₄/cab/ano) — LOOKUP
  1000    = conversão kg → t
  Ai      = área do talhão (ha)
```

**Fatores EF_ent (IPCC Tier 1 — América Latina):**

| Tipo de Animal | Sistema | EF_ent (kg CH₄/cab/ano) |
|----------------|---------|-------------------------|
| Gado corte | Extensivo | **56** |
| Gado corte | Semi-intensivo | **63** |
| Gado corte | Confinamento | **68** |
| Gado de leite | — | **83** |
| Ovinos | Todos | **5** |
| Caprinos | Todos | **5** |
| Equinos | Todos | **18** |

### 15.2 CH₄ por Deposição de Esterco (Eq. 12–13)

**Passo 1 — Sólidos Voláteis por animal (Eq. 13):**
```
VS (kg VS/cab/ano) = VS_rate × (W / 1000) × 365

Onde:
  VS_rate = 7.4 kg VS / (1000 kg massa animal × dia) — IPCC Tier 1 Am. Latina
  W       = peso médio (kg/cabeça) — INPUT_PRODUTOR ou default IPCC
```

**Passo 2 — CH₄ por esterco em pasto (Eq. 12):**
```
CH4_md (tCO₂e/ha) = (GWP_CH₄ × Σ (Pop_l × VS_l × AWMS_pasto × EF_CH4_md)) / (10⁶ × Ai)

Onde:
  AWMS_pasto = 1.0 (deposição direta — pastejo extensivo)
  EF_CH4_md  = 1.0 g CH₄ / kg VS — CONSTANTE (pasto América Latina, IPCC)
  10⁶        = g → t
  Ai         = área do talhão (ha)
```

### 15.3 CH₄ por Queima de Biomassa (Eq. 14)

```
CH4_bb (tCO₂e/ha) = (GWP_CH₄ × MB_queimado_kg × EF_CH4_bb) / (10⁹ × Ai)

Onde:
  MB_queimado (kg MS/ha) = biomassa_parte_aerea × CF × 1000
  biomassa_parte_aerea   = calculado via HI (§13.9)
  CF   = 0.80 — fração de combustão resíduos agrícolas (IPCC Table 2.6)
  EF_CH4_bb = 2.7 g CH₄ / kg MS queimada (cereais/gramíneas — IPCC Table 2.5)
  10⁹  = g → t (normalização)

Ativado apenas quando: queimaResiduos = true — INPUT_PRODUTOR
```

---

## 16. Motor de Cálculos — Módulo CO₂

> VM0042 v2.2 — Equações 6, 7, 8, 9
> Arquivo: `src/motor/co2.ts`

> **V5 — Equações completamente desagregadas.** A versão V4 documentava apenas as formas agregadas (Eq. 52 e Eq. 53 do VM0042). A V5 implementa e documenta os passos intermediários obrigatórios conforme §5.6 VM0042 v2.2, garantindo rastreabilidade operacional completa e compatibilidade com auditoria independente Verra.

### 16.1 CO₂ por Combustíveis Fósseis — Desagregado por Tipo (Eq. 6 → Eq. 7)

**Passo 1 — CO₂ por tipo de combustível por operação (Eq. 6):**
```
CO2_FF_ij (tCO₂e) = FFC_ij × EF_CO2_j

Onde:
  FFC_ij    = consumo do combustível j na operação i (litros) — INPUT_PRODUTOR
  EF_CO2_j  = fator de emissão do combustível j (tCO₂e/litro) — CONSTANTE
```

**Fatores EF_CO2 por combustível:**

| Combustível | EF_CO2 (tCO₂e/L) | Chave param | Fonte |
|-------------|-----------------|-------------|-------|
| Diesel | **0.002886** | `ef_diesel` | VM0042 v2.2 |
| Gasolina | **0.002310** | `ef_gasolina` | IPCC Table 3.3.1 |
| Etanol | **0** | — | Biogênico — não computa |

**Passo 2 — Agregação por tipo de combustível (Eq. 6 acumulado):**
```
CO2_j (tCO₂e) = Σ_i (FFC_ij × EF_CO2_j)   [para cada tipo j]

Resultado: co2ByFuelType = { diesel: X, gasolina: Y, ... }
Exposto como intermediário para auditoria linha a linha.
```

**Passo 3 — Total normalizado por área (Eq. 7):**
```
CO2_ff (tCO₂e/ha) = Σ_j CO2_j / Ai

Onde:
  Ai = área do talhão (ha)
```

**Referências de consumo típico (orientativo):**
- Aragem convencional: 40–60 L/ha diesel
- Plantio direto: 15–25 L/ha diesel
- Colheita mecanizada: 10–20 L/ha diesel

> **Justificativa da desagregação:** A Eq. 7 (e a forma simplificada Eq. 52) são matematicamente equivalentes ao somatório das Eq. 6, mas a forma desagregada permite: (i) auditoria detalhada por tipo de combustível e operação; (ii) análise de sensibilidade a fatores EF específicos; (iii) rastreabilidade exigida por VVBs credenciados pela Verra.

### 16.2 CO₂ por Calagem — Desagregado por Tipo de Corretivo (Eq. 8 → Eq. 9)

**Passo 1 — CO₂ por tipo de corretivo por aplicação (Eq. 8):**
```
CO2_EL_k (tCO₂e) = M_k × EF_EL_k × (44/12)

Onde:
  M_k       = massa do corretivo k aplicado (t/ha) — INPUT_PRODUTOR
  EF_EL_k   = fator de emissão de C do corretivo k (tC/t) — CONSTANTE
  44/12     = 3.6667 — conversão estequiométrica C → CO₂ (razão molecular)
```

**Fatores EF por tipo de corretivo:**

| Corretivo | EF (tC/t) | Chave param | Fonte |
|-----------|-----------|-------------|-------|
| Calcário calcítico (CaCO₃) | **0.12** | `ef_limestone` | IPCC §11.3 |
| Dolomita (CaMg(CO₃)₂) | **0.13** | `ef_dolomite` | IPCC §11.3 |
| Gesso agrícola (CaSO₄·2H₂O) | **0** | — | Não gera CO₂ — registrar separadamente |

**Passo 2 — Agregação por tipo de corretivo (Eq. 8 acumulado):**
```
CO2_k (tCO₂e/ha) = Σ aplicações do tipo k (M_k × EF_k × 44/12)

Resultado: co2ByLimeType = { calcitico: X, dolomitico: Y }
Exposto como intermediário para auditoria por tipo.
```

**Passo 3 — Total (Eq. 9):**
```
CO2_lime (tCO₂e/ha) = Σ_k CO2_k

= CO2_calcitico + CO2_dolomitico
= (M_CaCO3 × 0.12 + M_CaMg × 0.13) × (44/12) / Ai
```

> **Justificativa da desagregação:** A Eq. 9 (e forma simplificada Eq. 53) agrega os dois tipos. A forma desagregada explicita: (i) a cadeia físico-química do processo de dissolução do carbonato; (ii) a quantificação do C emitido por tipo de corretivo; (iii) a aplicação de fatores específicos; (iv) a conversão estequiométrica C → CO₂ com fator 44/12; (v) a normalização por área. Compatível com exigências de auditoria Verra e permite análise de sensibilidade por tipo de corretivo.

### 16.3 Visibilidade no Painel Admin e CSV Export

O `MotorSections.tsx` (seção CO₂) exibe explicitamente:
- Por operação: `Eq.6 — operação (combustível): litros × EF = tCO₂`
- Por tipo de combustível: `Eq.6 subtotal — diesel: X tCO₂/ha`
- Total: `Eq.7 — CO₂_ff total: Y tCO₂e/ha`
- Por corretivo: `Eq.8 — Calcário Calcítico: qtd × 0.12 × 3.667 = Z tCO₂/ha`
- Por tipo: `Eq.8 subtotal — calcitico: Z tCO₂/ha`
- Total: `Eq.9 — CO₂_lime total: W tCO₂e/ha`

O CSV exportado (`exportarCSV`) inclui linhas rotuladas `Eq.6` (por tipo), `Eq.7` (total combustíveis), `Eq.8` (por tipo), `Eq.9` (total calagem).

---

## 17. Cálculo de Créditos Líquidos

> VM0042 v2.2 — Equações 37, 40, 74 + VMD0053 v2.1 + VMD0054
> Arquivo: `src/motor/creditos.ts`

### 17.1 Reduções de Emissão — ER_t (Eq. 37)

```
ER_t (tCO₂e/ha) =
  Δ CO2_ff          (delta combustíveis — sem desconto de incerteza)
+ Δ CO2_lime        (delta calagem — sem desconto)
+ Δ CH4_ent         × (1 - UNC_CH4)
+ Δ CH4_md          × (1 - UNC_CH4)
+ Δ CH4_bb          (queima — sem desconto)
+ Δ N2O_soil        × (1 - UNC_N2O)
+ Δ N2O_bb          (queima — sem desconto)

Cada Δ = valor_baseline - valor_projeto
(positivo = o projeto emite menos = crédito)

UNC_CH4 e UNC_N2O: ver §17.3
```

### 17.2 Remoções de CO₂ — CR_t (Eq. 40)

```
CR_t_bruto (tCO₂e/ha) = (Δ_SOC_wp - Δ_SOC_bsl) × (44/12)
  onde Δ_SOC_wp  = delta SOC acumulado — cenário projeto (RothC)
       Δ_SOC_bsl = delta SOC acumulado — cenário baseline (RothC)

CR_t (tCO₂e/ha) = CR_t_bruto × (1 - UNC_CO2 × I)

Onde:
  I = +1 se CR_t_bruto > 0 (remoção — aplica desconto conservador)
  I = -1 se CR_t_bruto ≤ 0 (perda de SOC — o desconto aumenta a magnitude)
```

### 17.3 Dedução de Incerteza (Eq. 74 / Eq. 45 — VMD0053)

```
UNC (%) = (sqrt(s²) / Δ_médio) × 100 × t_0.667

Onde:
  s²       = variância combinada (amostragem de solo + propagação de modelo)
  t_0.667  = t-Student para 66.7% de confiança ≈ 0.4307
```

**Valores aplicados no sistema:**

| Situação | UNC_CO2 (SOC/CH₄) | UNC_N2O |
|----------|------------------|---------|
| **Com** laudo de solo (ISO/IEC 17025) | **6.5%** | 30% |
| **Sem** laudo de solo | **15%** | 30% |

### 17.4 Leakage — LK_t (VMD0054)

```
LK_t (tCO₂e/ha) = (ER_t + CR_t) × FPDS

FPDS (Fator de Deslocamento de Produção):
  = 0.05  → sem pecuária no projeto
  = 0.075 → com pecuária no projeto (+50% risco de leakage)
```

### 17.5 ERR_net e VCUs Finais

```
ERR_net_t (tCO₂e/ha) = CR_t + ER_t - LK_t

VCUs/ha = ERR_net_t × (1 - buffer_pool_rate)

VCUs_total = VCUs/ha × área_ha

Onde:
  buffer_pool_rate = 10–20% — INPUT_ADMIN (AFOLU Non-Permanence Risk Tool)
  Default: 15% (editável em AdminParametros → chave 'buffer_pool')
```

---

## 18. Fórmulas do Simulador

> Executadas 100% no frontend, em tempo real.

```
receita_anual = SUM(hectares × fator_SOC[pratica_i]) × preco_credito_BRL × (1 - buffer_pool)

receita_total = receita_anual × horizonte_anos

preco_credito_BRL = preco_base_USD × PTAX_venda_dia
                  = 20 × PTAX_venda_dia (API BCB ou fallback R$ 5.65)

buffer_pool = 0.15  (default — editável pelo Admin)
```

### Regra de Combinação de Práticas

```
fator_combinado = maior_fator_individual + 0.30 × soma_dos_demais_fatores

Exemplo:
  Prática A = 2.5 tCO₂e/ha/ano
  Prática B = 1.8 tCO₂e/ha/ano
  fator_combinado = 2.5 + (1.8 × 0.30) = 3.04 tCO₂e/ha/ano
```

---

## 19. Painel do Parceiro — Comissões

### Fórmula de Comissão

**Ano 0 (assinatura):**
```
Comissao_ano0 = US$ 1.00/ha × area_elegivel × PTAX
```

**Anos 2, 4, 6, 8, 10:**
```
Pm = (G_medio / 2) × US$ 1.00/ha × area_elegivel × PTAX

Onde:
  G_medio = média de VCUs líquidos gerados (tCO₂e/ha/ano)
```

### Níveis de Ranking

| Nível | Critério |
|-------|---------|
| Bronze | < 500 ha convertidos |
| Prata | 500–2.000 ha |
| Ouro | 2.000–5.000 ha |
| Platina | > 5.000 ha |

---

## 20. Control Sites e Baseline

### 20.1 Tipos de Baseline

**QA1 (RothC):** Baseline = modelo rodando com práticas pré-projeto. Não requer control site físico.

**QA2 (Measure & Re-measure):**
- Baseline = control sites físicos
- **Obrigatório:** mínimo 3 control sites por projeto; pelo menos 1 por estrato; ≤250km das unidades de quantificação

### 20.2 Opções de Baseline

**Opção A:** Área na própria fazenda com manejo convencional. Admin define como `control_site`.

**Opção B:** Fazenda vizinha. Deve estar a ≤250km e atender os 9 critérios de similaridade.

### 20.3 Alertas Automáticos (Admin)

| Condição | Tipo | Ação |
|----------|------|------|
| CS Ativos < 3 | **Bloqueante** | Não pode verificar créditos |
| CS Ativos < 10 | Aviso | Alta incerteza na estimativa |
| Fazenda sem cobertura | Aviso | Executar matching |
| Dados climáticos >30 dias | Aviso | Atualizar via API ou manual |

---

## 21. Motor de Matching — 9 Critérios VM0042

**Arquivo:** `src/motor/matchingControlSite.ts`

| # | Critério | Exigência | Implementação |
|---|---------|-----------|---------------|
| C1 | Distância | ≤ 250km | Haversine entre centroides |
| C2 | Zona climática IPCC | Mesma zona | String comparison |
| C3 | Ecorregião WWF | Mesma ecorregião | String comparison |
| C4 | Classe textural FAO | Mesma classe | Enum comparison |
| C5 | Grupo de solo WRB | Mesmo grupo | String comparison |
| C6 | Topografia | Mesma classe; aspecto ≤30° | ClasseDeclividade + aspecto |
| C7 | Precipitação | ±100mm MAR | Diferença absoluta |
| C8 | SOC% médio | t-test α=0.10 | Welch t-test com IC |
| C9 | Histórico ALM | Mesmas práticas 5 anos | Interseção de arrays |

```
score = (critérios_aprovados / 9) × 100

statusCobertura:
  "coberta"    → score ≥ 78 (≥7 critérios)
  "parcial"    → score ≥ 44 (≥4 critérios)
  "descoberta" → score < 44
```

---

## 22. Componentes de Mapa

*(sem alterações em relação à V4 — ver seção 22 do DevGuideV4 para detalhes)*

---

## 23. Banco de Fatores e Constantes

### 23.1 Fatores SOC por Prática (Simulador)

Fonte: Embrapa, IPCC 2019, Cerri et al., Bayer et al.

| Prática | Chave store | Faixa (tCO₂e/ha/ano) | Default |
|---------|-------------|---------------------|---------|
| Plantio direto (SPD) | `soc_fator_spdpd` | 1.5 – 3.5 | **2.5** |
| Planta de cobertura | `soc_fator_cobertura` | 1.0 – 4.0 | **2.0** |
| Rotação de culturas | `soc_fator_rotacao` | 0.5 – 2.0 | **1.2** |
| ILPF / ILP | `soc_fator_ilpf` | 2.0 – 6.0 | **3.5** |
| Reforma de pastagem | `soc_fator_pastagem` | 2.0 – 5.0 | **3.0** |
| Adubação orgânica | `soc_fator_org` | 0.5 – 2.5 | **1.5** |
| Biológicos/inoculantes | `soc_fator_biologicos` | 0.3 – 1.5 | **0.8** |
| Pastagem rotacionada | `soc_fator_rotac_past` | 1.0 – 3.0 | **1.8** |

### 23.2 Constantes Globais do Motor

| Constante | Valor | Tipo | Fonte |
|-----------|-------|------|-------|
| GWP_CH₄ | **28** tCO₂e/tCH₄ | CONSTANTE | IPCC AR5 (req. Verra) |
| GWP_N₂O | **265** tCO₂e/tN₂O | CONSTANTE | IPCC AR5 (req. Verra) |
| Conversão C → CO₂ | **44/12 = 3.6667** | CONSTANTE | Peso molecular |
| Conversão N₂O-N → N₂O | **44/28 = 1.5714** | CONSTANTE | Peso molecular |
| Fração C na matéria seca vegetal | **0.45** | CONSTANTE | IPCC default |
| EF_diesel | **0.002886** tCO₂e/L | PARAM `ef_diesel` | VM0042 v2.2 |
| EF_gasolina | **0.002310** tCO₂e/L | PARAM `ef_gasolina` | IPCC Table 3.3.1 |
| EF_limestone (CaCO₃) | **0.12** tC/t | CONSTANTE | IPCC §11.3 |
| EF_dolomite | **0.13** tC/t | CONSTANTE | IPCC §11.3 |
| EF1_N₂O default | **0.01** kg N₂O-N/kg N | PARAM | IPCC 2019 |
| EF1_N₂O inibidor | **0.005** | PARAM | IPCC 2019 |
| EF1_N₂O tropical úmido | **0.016** | PARAM | IPCC 2019 |
| EF1_N₂O tropical seco | **0.005** | PARAM | IPCC 2019 |
| EF4 — volatilização | **0.014** | CONSTANTE | IPCC 2019 |
| EF5 — lixiviação | **0.011** | CONSTANTE | IPCC 2019 |
| Frac_GASF sintético padrão | **0.11** | CONSTANTE | IPCC 2019 |
| Frac_GASF ureia | **0.15** | CONSTANTE | IPCC 2019 |
| Frac_GASM orgânico | **0.21** | CONSTANTE | IPCC 2019 |
| Frac_LEACH úmido/irrigado | **0.24** | CONSTANTE | IPCC 2019 |
| Frac_LEACH seco sem irrigação | **0** | CONSTANTE | IPCC 2019 |
| EF_N₂O_md (esterco em pasto) | **0.004** kg N₂O-N/kg N | CONSTANTE | IPCC 2019 |
| EF_BNF (fixação biológica) | **0.01** kg N₂O-N/kg N | CONSTANTE | IPCC 2019 |
| EF_CH4_md (esterco em pasto) | **1.0** g CH₄/kg VS | CONSTANTE | IPCC Am. Latina |
| EF_CH4_bb (queima biomassa) | **2.7** g CH₄/kg MS | CONSTANTE | IPCC Table 2.5 |
| EF_N₂O_bb (queima biomassa) | **0.07** g N₂O/kg MS | CONSTANTE | IPCC Table 2.5 |
| CF resíduos (frac. combustão) | **0.80** | CONSTANTE | IPCC Table 2.6 |
| VS_rate (gado Am. Latina) | **7.4** kg VS/(1000kg × dia) | CONSTANTE | IPCC Tier 1 |
| FPDS leakage padrão | **0.05** | PARAM | VMD0054 |
| Buffer pool default | **15%** | PARAM | AFOLU Risk Tool |
| k_DPM | **10.0** ano⁻¹ | CONSTANTE | RothC-26.3 |
| k_RPM | **0.3** ano⁻¹ | CONSTANTE | RothC-26.3 |
| k_BIO | **0.66** ano⁻¹ | CONSTANTE | RothC-26.3 |
| k_HUM | **0.02** ano⁻¹ | CONSTANTE | RothC-26.3 |
| k_IOM | **0** | CONSTANTE | RothC-26.3 |
| Fração BIO do BioHum | **46%** | CONSTANTE | RothC-26.3 |
| Fração HUM do BioHum | **54%** | CONSTANTE | RothC-26.3 |
| IOM (Falloon coef.) | 0.049, exp 1.139 | CONSTANTE | Falloon et al. 1998 |

### 23.3 Harvest Index, Razão Raiz:PA e N_content por Cultura

| Cultura | HI | Raiz:PA | N_content (tN/tMS) | Observação |
|---------|----|---------|--------------------|------------|
| Soja | 0.42 | 0.20 | 0.030 | Leguminosa fixadora |
| Milho | 0.50 | 0.22 | — | |
| Trigo | 0.40 | 0.24 | — | |
| Arroz | 0.45 | 0.20 | — | |
| Sorgo | 0.35 | 0.22 | — | |
| Algodão | 0.35 | 0.20 | — | |
| Cana-de-açúcar | 0.50 | 0.15 | — | |
| Café | 0.30 | 0.30 | — | Perene |
| Brachiaria/cobertura | n/a | 1.60 | — | Toda biomassa → input C |
| Crotalária | n/a | 0.40 | 0.025 | Leguminosa fixadora |
| Pastagem (Brachiaria) | n/a | 1.60 | — | Alto input C raízes |
| Feijão | ~0.42 | 0.20 | 0.028 | Leguminosa |

### 23.4 Teores de N por Fertilizante (NC_SF e NC_OF)

| Fertilizante Sintético | NC_SF |
|------------------------|-------|
| Ureia | 0.46 |
| MAP | 0.11 |
| DAP | 0.18 |
| Sulfato de amônio | 0.21 |
| KCl (cloreto de potássio) | 0 |

| Fertilizante Orgânico | NC_OF |
|-----------------------|-------|
| Esterco bovino | 0.015 |
| Cama de frango | 0.030 |
| Composto orgânico | 0.020 |

---

## 24. Parâmetros Globais do Sistema

**Arquivo:** `src/store/initial-data.ts` — array `parametros: ParametroSistema[]`
**47 parâmetros** pré-configurados, editáveis via `AdminParametros.tsx`.

| Categoria | Chaves | Editável |
|-----------|--------|----------|
| Financeiros | `preco_base_usd`, `ptax_fallback`, `buffer_pool`, `comissao_base_usd_ha` | ✓ |
| GWP | `gwp_ch4` (28), `gwp_n2o` (265) | Read-only |
| EF N₂O | `ef1_n2o_default`, `ef1_n2o_inibidor`, `ef1_n2o_umido`, `ef1_n2o_seco` | ✓ (com fonte) |
| EF Combustíveis | `ef_diesel`, `ef_gasolina` | ✓ (com fonte) |
| EF Calagem | `ef_limestone`, `ef_dolomite` | Read-only |
| Fatores SOC | `soc_fator_spdpd`... (8 fatores) | ✓ |
| Frações N₂O | `frac_gasf`, `frac_gasm`, `frac_leach`, `ef4_n2o_volat`, `ef5_n2o_leach` | Read-only |
| Leakage | `fator_leakage` | ✓ |

**Hierarquia de preferência para substituição de EF (VM0042 v2.2):**
```
1. Fator projeto-específico (publicação peer-reviewed)
2. Fator Tier 2 — fonte alternativa robusta (ex: MCTI)
3. Fator Tier 2 derivado de dados do projeto
4. Fator Tier 1 IPCC 2019 (default mínimo)

Ao substituir: campos Fonte + Justificativa obrigatórios.
```

---

## 25. Inputs por Perfil e Tela

### Legenda

| Código | Descrição |
|--------|-----------|
| `INPUT_PRODUTOR` | Digitado ou selecionado pelo produtor |
| `INPUT_ADMIN` | Inserido pela equipe Venture Carbon |
| `CALC_AUTO` | Calculado automaticamente |
| `API_EXTERNA` | Obtido de fonte externa (BCB, INMET) |
| `CONSTANTE` | Valor fixo da metodologia |
| `LOOKUP` | Selecionado conforme regra da tabela |

### Resumo por Dado Crítico

| Dado | Quem insere | Criticidade |
|------|-------------|-------------|
| SOC%, BD, %argila, profundidade | Admin | **CRÍTICO** |
| Temp/precip/evap mensais | Admin ou API | **CRÍTICO** |
| Tipo e qtd fertilizante | Produtor | Alta |
| Diesel por operação | Produtor → Eq. 6 | Média |
| Tipo e qtd calcário | Produtor → Eq. 8 | Média |
| buffer_pool_rate | Admin | Alta |

---

## 26. Regras de Negócio Gerais

### Conservadorismo (VM0042 v2.2 §8.6.3)

- Quando emissões **diminuem** no projeto vs. baseline: usar EF que resulte na **menor redução**
- Quando emissões **aumentam** no projeto: usar EF que resulte na **maior emissão**

### Frequência de Monitoramento

| Item | Frequência | Obrigatoriedade |
|------|-----------|----------------|
| Medição de SOC | A cada 5 anos mínimo | Obrigatória QA1 e QA2 |
| Dados ALM (manejo) | Anual | Attestation + evidência |
| Dados climáticos | Mensal | Alimenta RothC |
| Fatores de emissão | A cada 5 anos | Atualizar com melhor EF |
| Verificação de créditos | 1–5 anos | Por VVB credenciada |

### Fases Deferidas (Fora do Escopo do MVP)

- Backend Node.js/Express
- Integração direta com MapBiomas
- App mobile nativo
- WhatsApp API
- Autenticação real (JWT/bcrypt) — sistema usa auth mock

---

## 27. Changelog V4 → V5

### Maio 2026 — Versão 5.0

#### Motor de Cálculos — Equações Desagregadas CO₂ (`src/motor/co2.ts`)

**Mudança crítica — Eq. 6-7 (Combustíveis Fósseis):**
- **Antes (V4):** cálculo por operação internamente, exposto apenas como total `co2FfTco2eHa` (Eq. 52 agregada)
- **Agora (V5):** adicionado `co2ByFuelType: Record<string, number>` — sub-total por tipo de combustível (diesel, gasolina, etc.) calculado e exposto explicitamente antes da agregação (Eq. 7). Permite auditoria por tipo de combustível, análise de sensibilidade a EFs e rastreabilidade operacional completa

**Mudança crítica — Eq. 8-9 (Calagem):**
- **Antes (V4):** cálculo por corretivo internamente, exposto apenas como total `co2LimeTco2eHa` (Eq. 53 agregada)
- **Agora (V5):** adicionado `co2ByLimeType: Record<string, number>` — sub-total por tipo de corretivo (calcítico, dolomitico) calculado e exposto explicitamente antes da agregação (Eq. 9). Explicita a cadeia físico-química completa: `M_k × EF_k × (44/12)` por tipo antes da soma

#### Motor de Intermediários N₂O (`src/motor/index.ts`)

**Mudança — Frac_GASF e Frac_GASM:**
- **Antes (V4):** `fracGasfUsado` e `fracGasmUsado` calculados corretamente em `n2o.ts` mas **não mapeados** para `N2OProjIntermediarios`, resultando em `'—'` hardcoded no painel admin
- **Agora (V5):** `fracGasf` e `fracGasm` adicionados a `N2OProjIntermediarios`, mapeados de `n2oProj.fracGasfUsado` / `n2oProj.fracGasmUsado`, exibidos corretamente no painel admin e no CSV

#### Painel Admin — Seção CO₂ (`MotorSections.tsx`)

- Fórmulas atualizadas de `Eq.6-7 / Eq.52` para `Eq.6-7 VM0042` com descrição dos dois passos
- Fórmulas atualizadas de `Eq.8-9 / Eq.53` para `Eq.8-9 VM0042` com descrição dos dois passos
- Adicionados blocos dinâmicos de subtotais por tipo de combustível (Eq.6) e por tipo de corretivo (Eq.8)

#### CSV Export

- Labels `Eq.52` e `Eq.53` substituídos por `Eq.6`, `Eq.7`, `Eq.8`, `Eq.9`
- Linhas desagregadas por tipo de combustível (Eq.6) e por tipo de corretivo (Eq.8) adicionadas
- Totais rotulados como `Eq.7` (combustíveis) e `Eq.9` (calagem)

---

*Venture Carbon — Guia Técnico v5.0 · VM0042 v2.2 | VMD0053 v2.1 | VMD0054 | RothC-26.3 | IPCC AR5 · Maio 2026 · Confidencial*
