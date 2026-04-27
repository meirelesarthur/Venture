# Venture Carbon — Guia de Desenvolvimento
> Sistema Web Responsivo · React 19 · VM0042 v2.2 · RothC-26.3
> Versão 4.0 · Abril 2026 · Confidencial

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
├── co2.ts                 ← CO₂ combustíveis + calagem
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
│   │   ├── n2o.ts                       ← N₂O IPCC Tier 2
│   │   ├── ch4.ts                       ← CH₄ entérico + esterco + queima
│   │   ├── co2.ts                       ← CO₂ combustíveis + calagem
│   │   ├── creditos.ts                  ← ER/CR/LK → VCUs
│   │   ├── matchingControlSite.ts       ← 9 critérios VM0042
│   │   └── lookup.ts                    ← Tabelas EF, GWP, HI, DPM/RPM
│   │
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx       ← KPIs globais + mapa Brasil
│   │   │   ├── AdminClientes.tsx        ← Lista de produtores ativos
│   │   │   ├── AdminClienteDetalhe.tsx  ← Ficha + validação MRV do cliente
│   │   │   ├── AdminLeads.tsx           ← Fila de leads (aprovar/recusar)
│   │   │   ├── AdminFazendas.tsx        ← Grid/tabela com filtros e paginação
│   │   │   ├── AdminFazendaDetalhe.tsx  ← Fazenda completa (talhões + MRV)
│   │   │   ├── AdminValidacaoMRV.tsx    ← Fila de validação MRV
│   │   │   ├── AdminControlSites.tsx    ← Dashboard + lista + matching CS
│   │   │   ├── AdminControlSiteForm.tsx ← Cadastro/edição de control site
│   │   │   ├── AdminControlSiteDetalhe.tsx ← Detalhe e dados do CS
│   │   │   ├── AdminMotor.tsx           ← Runner do motor + resultados
│   │   │   ├── AdminParametros.tsx      ← Parâmetros globais editáveis
│   │   │   ├── AdminParceiros.tsx       ← Gestão de parceiros
│   │   │   └── AdminUsers.tsx           ← Gestão de usuários e permissões
│   │   │   └── components/
│   │   │       ├── mrv/
│   │   │       │   ├── TalhoesTab.tsx   ← Aba talhões (painéis redimensionáveis)
│   │   │       │   ├── TalhaoList.tsx   ← Lista de talhões com edição
│   │   │       │   ├── TalhaoPanels.tsx ← Painéis split (lista + mapa)
│   │   │       │   ├── BulkEditPanel.tsx← Edição em massa de talhões
│   │   │       │   └── MRVFazendaTab.tsx← Aba dados MRV da fazenda
│   │   │       ├── control-site/
│   │   │       │   ├── AlertaCard.tsx   ← Card de alerta (CS < 3/10)
│   │   │       │   └── ControlSiteSteps.tsx ← Wizard de cadastro CS
│   │   │       ├── motor/
│   │   │       │   ├── MotorEquations.tsx ← Exibição de equações/resultados
│   │   │       │   └── MotorSections.tsx  ← Seções colapsáveis do motor
│   │   │       ├── AdminHistoricoTab.tsx
│   │   │       └── AdminTalhoesTab.tsx
│   │   │
│   │   ├── parceiro/
│   │   │   ├── ParceiroDashboard.tsx    ← KPIs + ranking + comissões
│   │   │   ├── LeadsPage.tsx            ← Meus leads + filtros por status
│   │   │   ├── NovoLeadPage.tsx         ← Formulário de indicação
│   │   │   ├── ComissoesPage.tsx        ← Extrato de comissões
│   │   │   └── RankingPage.tsx          ← Ranking anônimo + metas
│   │   │
│   │   ├── cliente/
│   │   │   ├── DashboardPage.tsx        ← Dashboard do produtor
│   │   │   ├── MrvPage.tsx              ← MRV multi-aba (mapa+KML, lavoura, etc.)
│   │   │   ├── ResultadosPage.tsx       ← VCUs estimados e histórico
│   │   │   ├── PerfilPage.tsx           ← Dados cadastrais
│   │   │   └── mrv/
│   │   │       ├── LavouraForm.tsx      ← Dados de lavoura
│   │   │       ├── PecuariaForm.tsx     ← Dados de pecuária
│   │   │       ├── FertilizacaoForm.tsx ← Dados de fertilização
│   │   │       ├── OperacionalForm.tsx  ← Dados operacionais
│   │   │       ├── DocumentosForm.tsx   ← Upload de documentos
│   │   │       ├── MrvModals.tsx        ← Modais (edição talhão, delete, submit)
│   │   │       └── MrvIndicators.tsx    ← Indicadores de progresso MRV
│   │   │
│   │   ├── simulador/
│   │   │   ├── SimuladorPage.tsx        ← Wizard 7 steps (0-BemVindo a 6-Resultado)
│   │   │   └── components/
│   │   │       ├── Step1Localizacao.tsx
│   │   │       ├── Step2Area.tsx
│   │   │       ├── Step3Cultura.tsx
│   │   │       ├── Step4Praticas.tsx
│   │   │       ├── Step6Resultado.tsx
│   │   │       └── SimuladorMap.tsx     ← Mapa do simulador
│   │   │
│   │   └── auth/
│   │       ├── LoginPage.tsx
│   │       ├── CriarContaPage.tsx
│   │       └── RecuperarSenhaPage.tsx
│   │
│   ├── components/
│   │   ├── ui/                          ← 31 componentes base (shadcn/Radix)
│   │   │   ├── button.tsx, card.tsx, input.tsx, textarea.tsx
│   │   │   ├── table.tsx, tabs.tsx, badge.tsx, progress.tsx
│   │   │   ├── select.tsx, checkbox.tsx, label.tsx, separator.tsx
│   │   │   ├── dialog.tsx, sheet.tsx, tooltip.tsx, popover.tsx
│   │   │   ├── radio-group.tsx, switch.tsx, dropdown-menu.tsx
│   │   │   ├── alert-dialog.tsx, form.tsx, sonner.tsx
│   │   │   ├── resizable.tsx            ← react-resizable-panels wrapper
│   │   │   ├── mrv-status-badge.tsx     ← Badge por status MRV
│   │   │   ├── lead-status-badge.tsx    ← Badge por status de Lead
│   │   │   ├── cliente-status-badge.tsx ← Badge por status de Cliente
│   │   │   ├── crit-badge.tsx           ← Badge de criticidade
│   │   │   └── score-bar.tsx            ← Barra de score de matching
│   │   │
│   │   ├── maps/
│   │   │   ├── BrasilFazendasMap.tsx    ← Mapa admin (MapLibre + clustering)
│   │   │   ├── FazendaMap.tsx           ← Mapa de talhões por fazenda
│   │   │   └── KmlUploader.tsx          ← Upload KML com parser nativo
│   │   │
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx           ← Sidebar + topbar (sem scrollbar)
│   │   │   ├── PublicLayout.tsx         ← Layout público
│   │   │   ├── AuthGuard.tsx            ← Proteção de rota por role
│   │   │   └── GuestGuard.tsx           ← Redireciona autenticados
│   │   │
│   │   └── MapDemarcationOverlay.tsx    ← Overlay de demarcação no mapa
│   │
│   ├── constants/
│   │   ├── simulador.ts                 ← Fatores SOC, bônus, multiplicadores
│   │   └── climaticos.ts               ← Presets climáticos (Cerrado, Amazônia, Pampa)
│   │
│   └── lib/
│       ├── utils.ts                     ← cn() = clsx + tailwind-merge
│       └── rothc-simulator.ts           ← Utilitário JS RothC opcional
│
├── public/                              ← Assets estáticos
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── DevGuideV4.md                        ← Este documento
```

---

## 4. Perfis de Usuário

### 4.1 Lead (não autenticado)
Acessa apenas `/simulacao`. Não possui conta. Resultado exibe estimativa de receita e CTA para criar conta ou falar com consultor.

### 4.2 Cliente (Produtor Rural)
Usuário autenticado que representa uma fazenda. Submete dados de lavoura, pecuária, fertilização e operações para o MRV. Visualiza resultados e histórico de créditos.

**Permissões:**
- Leitura e edição dos próprios dados **antes** da aprovação do Admin
- Visualização de VCUs estimados, timeline e histórico
- Upload de documentos e KML
- Não pode aprovar, travar ou alterar dados após submissão

### 4.3 Parceiro
Usuário autenticado que indica leads. Tem painel de acompanhamento de comissões e ranking.

**Permissões:**
- Cadastrar novos leads com dados da propriedade
- Visualizar status e pipeline dos leads indicados
- Ver extrato de comissões projetadas e realizadas
- Ver ranking anônimo por hectares convertidos

### 4.4 Admin (Equipe Venture Carbon)
Usuário interno com acesso total ao sistema.

**Permissões:**
- Aprovar, rejeitar ou solicitar correção de qualquer dado MRV
- Travar dados validados (imutáveis com timestamp + ID admin)
- Inserir dados de solo (laudo), climáticos e de campo
- Cadastrar e gerenciar control sites + executar matching automático
- Editar parâmetros globais (preço USD, buffer pool, EFs)
- Substituir EF default por fator projeto-específico (fonte + justificativa obrigatórios)
- Acessar todos os clientes, parceiros, leads e fazendas
- Disparar motor de cálculos e visualizar resultados detalhados
- Gerenciar usuários e permissões

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
/dashboard                   → DashboardPage — visão geral + progresso MRV
/dashboard/mrv/*             → MrvPage — tabs: mapa+KML, lavoura, pecuária,
                               fertilização, operacional, documentos
/dashboard/resultados        → ResultadosPage — VCUs, gráficos, histórico
/dashboard/perfil            → PerfilPage — dados cadastrais

/* PARCEIRO (role: parceiro) */
/parceiro                    → ParceiroDashboard — KPIs + ranking + comissões
/parceiro/leads/novo         → NovoLeadPage — indicar novo produtor
/parceiro/leads              → LeadsPage — meus leads + filtro por status
/parceiro/comissoes          → ComissoesPage — extrato pago vs. projetado
/parceiro/ranking            → RankingPage — ranking anônimo + metas

/* ADMIN (role: admin) */
/admin                       → AdminDashboard — KPIs globais + mapa Brasil
/admin/clientes              → AdminClientes — lista de produtores ativos
/admin/clientes/:id          → AdminClienteDetalhe — ficha + validação MRV
/admin/leads                 → AdminLeads — fila de prospecções
/admin/parceiros             → AdminParceiros — gestão de parceiros
/admin/fazendas              → AdminFazendas — grid/tabela com filtros e paginação
/admin/fazendas/:fazendaId   → AdminFazendaDetalhe — fazenda completa
/admin/validacao             → AdminValidacaoMRV — fila de validação MRV
/admin/control-sites         → AdminControlSites — dashboard CS + matching
/admin/control-sites/novo    → AdminControlSiteForm — cadastrar CS
/admin/control-sites/:id     → AdminControlSiteDetalhe — detalhe CS
/admin/control-sites/:id/editar → AdminControlSiteForm — editar CS
/admin/motor/:fazendaId?     → AdminMotor — runner do motor + resultados
/admin/parametros            → AdminParametros — parâmetros globais
/admin/usuarios              → AdminUsers — gestão de usuários e permissões
```

---

## 6. Estado Global — Zustand Store

**Arquivo:** `src/store/data.ts`
**Middleware:** `persist` com `localStorage`, versão numérica para invalidação de cache.

> **CRÍTICO:** Ao alterar o `initialState()` (adicionar dados mock, alterar tipo de campo), **incremente a `version`** do persist para forçar `migrate: () => initialState()` e limpar o cache antigo do browser.

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

### Actions Disponíveis

**Parceiros**
```typescript
addParceiro(p: Omit<Parceiro, 'id'>) → void
updateParceiro(id: string, changes: Partial<Parceiro>) → void
```

**Leads**
```typescript
addLead(lead: Omit<Lead, 'id'>) → string
updateLeadStatus(id: string, status: LeadStatus, motivo?: string) → void
convertLeadToCliente(leadId: string) → void
```

**Fazendas & Talhões**
```typescript
addFazenda(f: Omit<Fazenda, 'id'>) → string
updateFazenda(id: string, changes: Partial<Fazenda>, obs?: string) → void
addTalhao(t: Omit<Talhao, 'id'>) → string
updateTalhao(id: string, changes: Partial<Talhao>, obs?: string) → void
```

**Coleta de Solo**
```typescript
addColetaSolo(c: Omit<ColetaSolo, 'id'>) → string
updateColetaSolo(id: string, changes: Partial<ColetaSolo>) → void
deleteColetaSolo(id: string) → void
```

**Histórico (append-only — imutável)**
```typescript
addEventoHistorico(e: Omit<EventoHistorico, 'id'>) → void
```

**MRV (Dados de Manejo Anual)**
```typescript
saveManejoRascunho(data: Partial<DadosManejoAnual>) → string
updateManejo(id: string, changes: Partial<DadosManejoAnual>) → void
submitManejo(id: string) → void          // status → pendente
approveManejo(id: string) → void         // status → aprovado
requestCorrection(id: string, comentario: string) → void  // status → correcao
```

**Control Sites**
```typescript
addControlSite(site: Omit<ControlSite, 'id'>) → void
updateControlSite(id: string, changes: Partial<ControlSite>) → void
```

**Matching (CS ↔ Fazenda)**
```typescript
addMatchResult(r: Omit<MatchResult, 'id'>) → string
clearMatchResults(controlSiteId: string) → void
getMatchResultsForFazenda(fazendaId: string) → MatchResult[]
```

**Parâmetros Globais**
```typescript
setParametro(chave: string, valor: number, fonte?: string) → void
getParam(chave: string) → number
```

**Motor**
```typescript
addResultadoMotor(r: Omit<ResultadoMotor, 'id'>) → string
clearResultadosTalhao(talhaoId: string, ano: number) → void
```

**Dados Climáticos**
```typescript
saveDadoClimatico(dado: DadoClimatico) → void
```

**Notificações**
```typescript
addNotificacao(n: Omit<Notificacao, 'id'>) → void
marcarLida(id: string) → void
marcarTodasLidas(para: UserRole) → void
```

**Alertas**
```typescript
addAlerta(a: Omit<Alerta, 'id'>) → void
resolverAlerta(id: string) → void
```

**Usuários**
```typescript
addUsuario(u: Omit<Usuario, 'id'>) → void
updateUsuario(id: string, changes: Partial<Usuario>) → void
```

**Utilitário**
```typescript
resetToInitialData() → void   // Restaura estado para initial-data.ts
```

---

## 7. Tipos e Entidades

**Arquivo:** `src/store/types.ts`

### Lead
```typescript
interface Lead {
  id: string
  parceiroId?: string
  nome: string
  email?: string
  telefone?: string
  fazenda: string
  municipio?: string
  estado?: string
  area: number                    // ha
  culturas?: string[]
  manejoAtual?: string
  praticas?: string[]
  horizonteAnos?: number
  receitaEstimada?: number        // R$
  tco2eEstimado?: number
  status: LeadStatus
  motivoRecusa?: string
  data: string                    // ISO date
}

type LeadStatus = 'novo' | 'em_analise' | 'aprovado' | 'contratado' | 'recusado' | 'efetivado'
```

### Fazenda
```typescript
interface Fazenda {
  id: string
  produtorId: string
  nome: string
  municipio: string
  estado: string
  areaTotalHa: number
  kmlUrl?: string
  kmlGeoJson?: FeatureCollection   // GeoJSON do KML carregado
  zonaClimatica: ZonaClimaticaIPCC
}
```

### Talhao
```typescript
interface Talhao {
  id: string
  fazendaId: string
  nome: string
  areaHa: number
  tipo: 'projeto' | 'control_site' | 'excluido'
  // Dados de solo (inseridos pelo Admin)
  socPercent?: number             // %SOC — laudo laboratorial
  bdGCm3?: number                 // g/cm³ — medição de campo
  argilaPercent?: number          // % argila — laudo
  profundidadeCm?: number         // cm — mínimo 30cm
  pontosColetados?: number
  grupoSoloFao?: string
  texturaFao?: ClasseTexturaFAO
  topografia?: ClasseDeclividade
  dadosValidados?: boolean        // travado pelo Admin
  latCenter?: number
  lngCenter?: number
  socTimestamp?: string           // data da última coleta de SOC
}
```

### DadosManejoAnual
```typescript
interface DadosManejoAnual {
  id: string
  talhaoId: string
  fazendaId: string
  anoAgricola: number
  cenario: 'baseline' | 'projeto'
  status: MrvStatus
  comentarioCorrecao?: string
  versao?: number
  submetidoEm?: string
  aprovadoEm?: string

  // Lavoura
  cultura?: string
  culturas?: string[]
  plantasCobertura?: string[]
  dataPlantio?: string            // dd/mm
  dataColheita?: string           // dd/mm
  produtividade?: number
  unidadeProd?: string
  residuosCampo?: boolean
  queimaResiduos?: boolean
  usaIrrigacao?: boolean
  tipoIrrigacao?: string

  // Fertilizantes
  fertilizantesSint?: FertilizanteSint[]
  fertilizantesOrg?: FertilizanteOrg[]
  calcario?: Calcario[]
  produtosBiologicos?: ProdutoBiologico[]

  // Operacional (mecanização)
  operacoes?: Operacao[]

  // Pecuária
  pecuaria?: RegistroPecuaria[]
}

type MrvStatus = 'rascunho' | 'pendente' | 'aprovado' | 'correcao'
```

### ControlSite
```typescript
interface ControlSite {
  id: string
  nome: string
  // Geolocalização
  centroide_lat: number
  centroide_lng: number
  area_ha: number
  // Critérios VM0042
  zona_climatica_ipcc: ZonaClimaticaIPCC
  ecorregiao_wwf: string
  classe_textural_fao: ClasseTexturaFAO
  grupo_solo_wrb: string
  classe_declividade: ClasseDeclividade
  aspecto_cardinal?: AspectoCar
  precip_media_anual_mm: number
  fonte_precip: string
  dist_estacao_meteo_km: number
  // SOC baseline
  soc_medio_pct: number
  soc_ic_lower?: number
  soc_ic_upper?: number
  n_amostras_soc: number
  // Histórico
  historico_manejo: string[]      // práticas últimos 5 anos
  cobertura_historica: string
  ano_conversao?: number
  // Gestão
  gestor_nome: string
  gestor_tipo: GestorTipo
  status_cs: 'Ativo' | 'Em_implantacao' | 'Inativo'
  data_cadastro: string
  data_primeira_coleta?: string
  // Vínculos
  fazendasVinculadasIds: string[]
  talhaoVinculadoIds: string[]
}

type GestorTipo = 'proponente' | 'parceiro' | 'externo'
```

### MatchResult (CS ↔ Fazenda — 9 Critérios VM0042)
```typescript
interface MatchResult {
  id: string
  controlSiteId: string
  fazendaId: string
  calculadoEm: string
  criterios: {
    c1_distancia: CriterioResult       // ≤ 250km (Haversine)
    c2_zona_climatica: CriterioResult  // mesma zona IPCC
    c3_ecorregiao: CriterioResult      // mesma ecorregião WWF
    c4_textura_solo: CriterioResult    // mesma classe FAO
    c5_grupo_solo: CriterioResult      // mesmo grupo WRB
    c6_declividade: CriterioResult     // mesma classe + aspecto ≤30°
    c7_precipitacao: CriterioResult    // ±100mm MAR
    c8_soc_ttest: CriterioResult       // t-test α=0.10
    c9_historico_manejo: CriterioResult// mesmas práticas 5 anos
  }
  score: number                        // 0–100
  matchTotal: number                   // critérios aprovados (de 9)
  statusCobertura: 'coberta' | 'parcial' | 'descoberta'
  criteriosPendentes: string[]
}
```

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
  co2FfTco2eHa: number              // combustíveis fósseis
  co2LimeTco2eHa: number            // calagem

  // VCUs
  erTTco2eHa: number                // Emission Reduction
  crTTco2eHa: number                // Carbon Removal
  lkTTco2eHa: number                // Leakage
  uncCo2: number                    // incerteza SOC
  uncN2o: number                    // incerteza N₂O
  errNetTco2eHa: number             // ER + CR − LK − incerteza
  bufferPoolRate: number
  vcusEmitidosHa: number            // após buffer pool
  vcusEmitidosTotal: number         // × área ha

  detalhesCalculo: DetalhesCalculo  // todos os intermediários expostos
}
```

### Enums

```typescript
type ZonaClimaticaIPCC =
  | 'tropical_moist'        // Tropical úmido (precip >1000mm/ano)
  | 'tropical_dry'          // Tropical seco (<1000mm/ano)
  | 'warm_temperate_moist'
  | 'warm_temperate_dry'
  | 'cool_temperate_moist'
  | 'cool_temperate_dry'
  | 'boreal'
  | 'polar'

type ClasseDeclividade =
  | 'nearly_level'          // 0–2%
  | 'gently_sloping'        // 2–5%
  | 'sloping'               // 5–10%
  | 'moderately_steep'      // 10–15%
  | 'steep'                 // 15–30%
  | 'very_steep'            // >30%

type ClasseTexturaFAO =
  | 'Sandy' | 'Loamy' | 'Clayey' | 'Silty' | 'Sandy Loam' | 'Clay Loam'

type AspectoCar = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

type UserRole = 'Super Admin' | 'Admin' | 'Editor' | 'Visualizador'
```

---

## 8. Fluxo 1 — Simulador (Lead)

**URL pública:** `/simulacao`
**Execução:** 100% no frontend, em tempo real.
**Wizard de 7 steps** — steps 0 a 6.

### Steps do Wizard

| Step | Componente | Descrição |
|------|-----------|-----------|
| 0 | BemVindo (interno) | Tela de boas-vindas |
| 1 | Step1Localizacao | Município + estado |
| 2 | Step2Area | KML upload ou área manual (ha) |
| 3 | Step3Cultura | Seleção de culturas e manejo atual |
| 4 | Step4Praticas | Checkboxes de práticas + horizonte |
| 5 | Lead capture | Nome, email, telefone |
| 6 | Step6Resultado | Estimativa de receita, gráfico, CTAs |

**TickerEstimativa:** componente que exibe estimativa de receita em R$ em tempo real conforme o usuário interage com as práticas.

### Step 1 — Localização

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Município | text | ✓ |
| Estado | select (UF) | ✓ |

### Step 2 — Área

**Opção A:** Upload `.kml` → parser via `DOMParser` nativo → área calculada por `@turf/area`
**Opção B:** Campo numérico — `área (ha)` — número decimal positivo

### Step 3 — Cultura e Manejo

**Seleção múltipla de culturas:** soja, milho, algodão, cana, café, pasto, trigo, arroz, sorgo, outros

Para cada cultura, coletar manejo dos últimos 3 anos:

| Variável | Tipo | Opções |
|----------|------|--------|
| `tipo_preparo` | select | Convencional / Reduzido / Plantio Direto |
| `usa_cobertura` | boolean | Sim / Não |
| `usa_org` | boolean | Sim / Não |
| `tem_pecuaria` | boolean | Sim / Não |

**Árvore de elegibilidade:**
```
Se já faz TODAS as práticas regenerativas há > 3 anos:
  → Flag: "Elegibilidade pode ser limitada" (continua com aviso)
Caso contrário:
  → Prossegue normalmente
```

### Step 4 — Práticas Desejadas

**8 práticas com checkboxes** — recálculo em tempo real a cada seleção.
**Seletor de horizonte:** 10 anos | 20 anos.

As práticas disponíveis (de `src/constants/simulador.ts`):

| Prática | Chave | Fator SOC default |
|---------|-------|-------------------|
| Plantio Direto (SPD) | `plantio_direto` | 2.5 tCO₂e/ha/ano |
| Plantas de Cobertura | `cobertura` | 2.0 |
| Rotação de Culturas | `rotacao` | 1.2 |
| ILPF / ILP | `ilpf` | 3.5 |
| Reforma de Pastagem | `pastagem` | 3.0 |
| Adubação Orgânica | `org` | 1.5 |
| Biológicos/Inoculantes | `biologicos` | 0.8 |
| Pastagem Rotacionada | `rotac_past` | 1.8 |

### Step 6 — Resultado

**Exibe:**
- Estimativa de receita total (R$) no horizonte selecionado
- tCO₂e estimadas por ano
- Valor por hectare por ano (R$/ha/ano)
- Gráfico de barras: receita projetada ano a ano
- Comparativo: custo manejo convencional vs. regenerativo
- Texto fixo: *"Custo para você: R$ 0 — Venture arca com todos os custos"*

**CTAs:**
- `[Falar com Consultor]` → WhatsApp ou email
- `[Criar Conta Completa]` → `/criar-conta`

---

## 9. Fluxo 2 — MRV Digital (Cliente)

**URL:** `/dashboard/mrv/*`

### Aba Mapa + KML (Layout em Telas Grandes)

Layout side-by-side em `lg:` screens (≥ 1024px):
- **30% esquerda:** `KmlUploader` com `className="h-full"` para esticar à altura do mapa
- **70% direita:** `FazendaMap` com `height="100%"`
- Wrapper flex com `items-stretch` para igualar alturas

```tsx
<div className="flex flex-col lg:flex-row gap-4 items-stretch">
  <div className="lg:w-[30%] h-full">
    <KmlUploader onLoad={handleKmlLoad} label="..." className="h-full" />
  </div>
  <div className="lg:w-[70%] rounded-xl overflow-hidden border border-border/50 min-h-[280px]">
    <FazendaMap talhoes={projetoTalhoes} height="100%" />
  </div>
</div>
```

### Tabs de Dados MRV

| Tab | Componente | Dados Coletados |
|-----|-----------|-----------------|
| Mapa | KmlUploader + FazendaMap | KML da propriedade |
| Lavoura | LavouraForm | Cultura, datas, produtividade, irrigação, queima |
| Pecuária | PecuariaForm | Animais, sistema, quantidade, peso |
| Fertilização | FertilizacaoForm | Fertilizantes Sint./Org., calcário, inibidores |
| Operacional | OperacionalForm | Diesel por operação mecanizada |
| Documentos | DocumentosForm | Upload de laudos e atestados |

#### 9.1 Dados de Lavoura (por talhão)

| Variável | Tipo de Input | Unidade | Cálculo Alimentado |
|----------|-------------|---------|-------------------|
| `cultura` | seleção lista | — | HI, DPM/RPM, N_content |
| `dataPlantio` | seletor data dd/mm | — | Fator c (cobertura RothC) |
| `dataColheita` | seletor data dd/mm | — | Fator c (cobertura RothC) |
| `produtividade` | numérico | sacas/ha ou t/ha | Input C vegetal via HI |
| `usaIrrigacao` | boolean + tipo | — | `Frac_LEACH` (Eq. 23) |
| `queimaResiduos` | boolean | — | `CH4_bb` (Eq. 14), `N2O_bb` |

#### 9.2 Dados de Pecuária

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `tipo_animal` | seleção | — | `EF_ent`, `Nex`, `VS_rate` |
| `sistema_producao` | seleção | — | `EF_ent` |
| `quantidade_animais` | inteiro | cabeças | `Pop` (Eq. 11, 12, 28) |
| `peso_medio` | numérico ou default IPCC | kg/cabeça | `VS` (Eq. 13) |
| `tempo_permanencia` | numérico | meses/ano | `MS` (Eq. 28) |

#### 9.3 Dados de Fertilização

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `tipo_fertilizante_sint` | seleção | — | `NC_SF` → Eq. 19 |
| `qtd_fertilizante_sint` | numérico | kg/ha | `M_SF` → Eq. 19 |
| `usa_inibidor` | boolean | — | `EF_Ndirect`: 0.01 → 0.005 |
| `tipo_fertilizante_org` | seleção | — | `NC_OF` → Eq. 20 |
| `qtd_fertilizante_org` | numérico | t/ha | `M_OF` → Eq. 20 |
| `tipo_calcario` | seleção | — | `M_Limestone` ou `M_Dolomite` |
| `qtd_calcario` | numérico | t/ha | Eq. 9 |

#### 9.4 Dados Operacionais

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `operacoes_mecanizadas` | seleção múltipla | — | `FFC` → Eq. 7 |
| `combustivel_tipo` | seleção por operação | — | `EF_CO2,j` → Eq. 7 |
| `combustivel_litros` | numérico | litros | `FFC` → Eq. 7 |

#### 9.5 Dados de Solo (inseridos pelo Admin)

| Variável | Input | Unidade | Criticidade |
|----------|-------|---------|------------|
| `SOC_percent` | laudo ISO/IEC 17025 | % | **CRÍTICO** |
| `BD` | anel volumétrico ISO 11272 | g/cm³ | **CRÍTICO** |
| `argila_percent` | laudo laboratorial | % | **CRÍTICO** |
| `profundidade_cm` | campo mínimo 30cm | cm | **CRÍTICO** |

#### 9.6 Dados Climáticos (Admin ou API)

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `temp_mensal[1..12]` | API INMET ou manual | °C | Fator a (RothC 2.1.3) |
| `precip_mensal[1..12]` | API ou manual | mm/mês | TSMD (2.1.4), `Frac_LEACH` |
| `evap_mensal[1..12]` | Penman-Monteith ou tanque | mm/mês | TSMD (2.1.4) |
| `zona_climatica_IPCC` | LOOKUP por coordenadas | — | `EF_Ndirect`, `Frac_LEACH` |

**Presets disponíveis em `src/constants/climaticos.ts`:**
- `preset_cerrado` — Cerrado/savana seca
- `preset_amazonia` — Amazônia / floresta tropical
- `preset_pampa` — Pampa / temperado

### Fluxo de Aprovação MRV

```
Produtor submete dados
       ↓
Status: "pendente"
       ↓
Admin revisa em /admin/validacao
       ↓
    ┌──────────────────────┐
    │                      │
 Aprovar               Solicitar Correção
    │                      │
    ↓                      ↓
 status → aprovado    status → correcao
 Dado travado         Notificação ao produtor
 (timestamp + adminId) Produtor resubmete
    ↓
 Motor pode ser disparado
```

---

## 10. Fluxo 3 — Painel do Parceiro

**URL:** `/parceiro`

### Dashboard do Parceiro

- **KPIs:** Total pago, Total projetado, Hectares indicados, Leads convertidos
- **Ranking:** Bronze → Prata → Ouro → Platina com progress bar para próximo nível
- **Demo mode:** toggle para mostrar dados fictícios sem expor dados reais
- **Leads recentes:** lista com badge de status
- **Gráfico:** Comissão paga vs. projetada (Recharts)

### Cadastrar Novo Lead (`/parceiro/leads/novo`)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome do produtor | text | ✓ |
| Telefone | tel | ✓ |
| Email | email | ✓ |
| Nome da fazenda | text | ✓ |
| Município + estado | text | ✓ |
| Área estimada (ha) | numérico | ✓ |
| Cultura principal | seleção | ✓ |
| Manejo atual | seleção | ✓ |
| Upload KML | arquivo | Opcional |

### Pipeline de Status do Lead

```
novo → em_analise → aprovado → contratado → efetivado
                            ↘ recusado (com motivo obrigatório)
```

---

## 11. Fluxo 4 — Admin Venture Carbon

### AdminDashboard (`/admin`)

- KPIs globais: Clientes, Parceiros, Control Sites ativos, Pendências MRV
- **Mapa Brasil** (BrasilFazendasMap): 22 fazendas mock distribuídas pelo Brasil
  - Altura: `442px` (30% maior que versão anterior)
  - Clustering por zoom com `clusterMaxZoom: 11`
  - Hover: popup rico com área, talhões, zona, status MRV, produtor
  - Click: navega para `/admin/fazendas/:id`
- Fila de leads (novo/em_analise)
- Fila de validação MRV (pendente/correcao)

### AdminFazendas (`/admin/fazendas`)

- **Toggle Grid/Tabela** via pill buttons
- **Filtros:** busca por nome/município, zona climática, UF (estado)
- **Paginação:** 9 cards (grid) ou 12 linhas (tabela) por página
- Indicador `X–Y de N fazendas` + botões prev/next + numeração de páginas

### AdminValidacaoMRV (`/admin/validacao`)

- Fila de todos os registros de manejo
- Filtro por status: todos, pendente, aprovado, correcao, rascunho
- Cards expansíveis com:
  - Datas plantio/colheita
  - Fertilizantes sintéticos e operações
  - Comentários de correção existentes
- Botão **Aprovar** e **Solicitar Correção** com textarea
- Toast de confirmação em cada ação

### AdminControlSites (`/admin/control-sites`)

**3 abas:**

**Dashboard:**
- KPIs: CS Ativos, Fazendas Cobertas, % Área Coberta, Fazendas Descobertas
- Alertas automáticos: `< 3 sites` (bloqueante), `< 10 sites` (aviso), fazendas sem cobertura
- ScoreBar por fazenda com percentual de cobertura

**Lista:**
- Tabela de todos os CS: nome, área, SOC%, amostras, melhor score de matching
- Click → detalhe do CS

**Matching:**
- Seleção de CS + Fazenda → `[Executar Matching]`
- Exibe 9 critérios com ✓/✗ + detalhe de cada critério
- Score total (0–100) + status cobertura

### AdminMotor (`/admin/motor/:fazendaId?`)

- Seleção de fazenda + talhão + ano agrícola
- Botão `[Executar Motor]` chama `rodarMotorCompleto()`
- Progress bar com callback `onProgress(step, percent)`
- Resultados por módulo (RothC, N₂O, CH₄, CO₂, VCUs) em seções expansíveis
- Tabela de intermediários via `detalhesCalculo`

### Parâmetros Globais Editáveis pelo Admin

| Parâmetro | Chave | Default | Editável |
|-----------|-------|---------|----------|
| Preço base crédito | `preco_base_usd` | US$ 20/tCO₂e | ✓ |
| PTAX fallback | `ptax_fallback` | 5.65 R$/USD | ✓ |
| Buffer pool | `buffer_pool` | 0.15 (15%) | ✓ |
| Comissão base | `comissao_base_usd_ha` | US$ 1.00/ha | ✓ |
| GWP CH₄ | `gwp_ch4` | 28 | Read-only |
| GWP N₂O | `gwp_n2o` | 265 | Read-only |
| EF N₂O default | `ef1_n2o_default` | 0.01 | ✓ (com fonte+justificativa) |
| EF diesel | `ef_diesel` | 0.002886 tCO₂e/L | ✓ |

**Regra de Substituição de EF:**
```
Hierarquia de preferência (VM0042 v2.2):
  1. Fator projeto-específico (publicação peer-reviewed)
  2. Fator Tier 2 de fonte alternativa robusta (ex: MCTI)
  3. Fator Tier 2 derivado de dados do projeto
  4. Fator Tier 1 IPCC 2019 (default mínimo)

Ao substituir: sistema exige Fonte + Justificativa (campos obrigatórios).
```

---

## 12. Motor de Cálculos — Arquitetura

**Arquivo principal:** `src/motor/index.ts`
**Função principal:** `rodarMotorCompleto(talhao, manejoProj, manejoBase, dadoClimatico, parametros, onProgress?)`

### Assinatura

```typescript
async function rodarMotorCompleto(
  talhao: Talhao,
  manejoProj: DadosManejoAnual,
  manejoBase: DadosManejoAnual,
  dadoClimatico: DadoClimatico,
  parametros: ParametroSistema[],
  onProgress?: (step: string, percent: number) => void
): Promise<ResultadoMotor>
```

### Sequência de Execução

```
1. RothC Baseline   ← rothc.ts
2. RothC Projeto    ← rothc.ts
3. N₂O Baseline     ← n2o.ts
4. N₂O Projeto      ← n2o.ts
5. CH₄ Baseline     ← ch4.ts
6. CH₄ Projeto      ← ch4.ts
7. CO₂ Projeto      ← co2.ts (sempre projeto, não baseline)
8. VCUs             ← creditos.ts
```

### Módulos do Motor

| Arquivo | Função Principal | Protocolo |
|---------|-----------------|-----------|
| `rothc.ts` | `calcRothC(talhao, manejo, clima, anos)` | RothC-26.3 mensal |
| `n2o.ts` | `calcN2O(manejo, talhao, clima, params)` | VM0042 Eq. 16–31 |
| `ch4.ts` | `calcCH4(manejo, talhao, params)` | VM0042 Eq. 11–14 |
| `co2.ts` | `calcCO2(manejo, talhao, params)` | VM0042 Eq. 6–9 |
| `creditos.ts` | `calcCreditos(er, cr, lk, unc, params)` | VM0042 Eq. 37–45 |
| `matchingControlSite.ts` | `matchControlSite(cs, fazenda, talhoes)` | 9 critérios |
| `lookup.ts` | Tabelas: EF, GWP, HI, DPM/RPM | Referência constante |

### Projeção de Anos

O motor roda por padrão **3 anos** (configurável). Para cada ano:
- Dois cenários: `baseline` e `projeto`
- Delta acumulativo de SOC (compartimentos DPM+RPM+BIO+HUM+IOM)
- VCUs calculados no delta anual

---

## 13. Motor de Cálculos — Módulo RothC

> RothC-26.3 — Quantification Approach 1 (SOC)
> Executa mensalmente para cada talhão em dois cenários: Baseline e Projeto.

### 13.1 Decomposição Mensal de Compartimento

```
Y_final = Y × exp(-a × b × c × k × t)

Material decomposto no mês = Y × (1 - exp(-a × b × c × k × t))

Onde:
  Y = estoque atual no compartimento (tC/ha)
  a = fator de temperatura (seção 13.3)
  b = fator de umidade via TSMD (seção 13.4)
  c = fator de cobertura do solo (seção 13.5)
  k = constante de decomposição (ano⁻¹) — ver tabela abaixo
  t = 1/12 (passo mensal fixo — CONSTANTE)
```

### 13.2 Constantes de Decomposição (k)

| Compartimento | Descrição | k (ano⁻¹) |
|---------------|-----------|-----------|
| `k_DPM` | Material vegetal decomponível | 10.0 |
| `k_RPM` | Material vegetal resistente | 0.3 |
| `k_BIO` | Biomassa microbiana | 0.66 |
| `k_HUM` | Matéria orgânica humificada | 0.02 |
| `k_IOM` | Matéria orgânica inerte | 0 (não decompõe) |

### 13.3 Fator de Temperatura (a)

```
a = 47.9 / (1 + exp(106 / (T + 18.27)))

Onde:
  T = temperatura média mensal (°C)
  Constantes: 47.9, 106, 18.27 — fixas do modelo RothC
```

### 13.4 Fator de Umidade (b) via TSMD

**5 passos executados automaticamente:**

**Passo 1 — Max TSMD (0–23cm):**
```
Max_TSMD = -(20.0 + 1.3 × %argila - 0.01 × %argila²)
```

**Passo 2 — Ajuste para profundidade:**
```
Max_TSMD_ajustado = (Max_TSMD / 23) × profundidade_cm
```

**Passo 3 — Bare Soil Moisture Deficit:**
```
BareSMD = Max_TSMD / 1.8
```

**Passo 4 — Acumular TSMD mensal:**
```
Se (0.75 × evaporacao) > precipitacao:
  Acc_TSMD += (precipitacao - 0.75 × evaporacao)
  Acc_TSMD não ultrapassa Max_TSMD

Quando precipitacao > 0.75 × evaporacao:
  Solo reidrata: Acc_TSMD → 0
```

**Passo 5 — Calcular fator b:**
```
Se Acc_TSMD >= 0.444 × Max_TSMD:
  b = 1.0
Caso contrário:
  b = 0.2 + (1.0 - 0.2) × (Max_TSMD - Acc_TSMD) / (Max_TSMD - 0.444 × Max_TSMD)
```

### 13.5 Fator de Cobertura do Solo (c)

```
c = 0.6  → solo vegetado (entre dataPlantio e dataColheita)
c = 1.0  → solo exposto
```

Sistema monta vetor de 12 meses automaticamente a partir das datas de plantio/colheita.

### 13.6 Particionamento CO₂ vs (BIO+HUM) por %Argila

```
x = 1.67 × (1.85 + 1.60 × exp(-0.0786 × %argila))

Fração perdida como CO₂    = x / (x + 1)
Fração retida como BIO+HUM = 1 / (x + 1)

Do BIO+HUM formado:
  46% → BIO
  54% → HUM
```

### 13.7 Razão DPM/RPM por Tipo de Input Vegetal

| Tipo de Vegetal | DPM/RPM | DPM% | RPM% |
|-----------------|---------|------|------|
| Culturas agrícolas / pastagem melhorada | 1.44 | 59% | 41% |
| Pastagem não melhorada / savana | 0.67 | 40% | 60% |
| Floresta decídua/tropical | 0.25 | 20% | 80% |
| FYM (esterco/compostagem) | — | 49% | 49% + 2% HUM direto |

### 13.8 IOM — Matéria Orgânica Inerte

```
IOM = 0.049 × TOC^1.139   (Falloon et al., 1998)

Onde:
  TOC = carbono orgânico total (tC/ha) — INPUT_ADMIN via laudo
```

### 13.9 Input de Carbono Vegetal via Harvest Index

```
biomassa_parte_aerea = (Yield / HI) - Yield

biomassa_raizes = biomassa_parte_aerea × razao_raiz_parte_aerea

input_C_total = (biomassa_parte_aerea + biomassa_raizes) × 0.45

Onde:
  Yield = produtividade (t MS/ha) — convertido de sacas/ha
  HI    = Harvest Index — LOOKUP por cultura (seção 23.3)
  0.45  = fração de C na matéria seca (CONSTANTE IPCC)
```

### 13.10 Estoque de SOC (Inicialização)

```
SOC_stock (tC/ha) = (SOC% / 100) × BD × profundidade_cm × 100

Onde:
  SOC%         = % C orgânico no solo — INPUT_ADMIN (laudo)
  BD           = densidade aparente (g/cm³ = Mg/m³) — INPUT_ADMIN
  profundidade = cm — mínimo 30cm, recomendado 50cm
```

> ⚠️ **CRÍTICO:** SOC%, BD e profundidade são os inputs mais importantes. Inicializam todo o modelo RothC. Coleta: ISO 18400-104. Laudo: laboratório ISO/IEC 17025.

### 13.11 Conversão SOC → CO₂

```
CO₂ (tCO₂e/ha) = delta_SOC (tC/ha) × (44/12)

44/12 = 3.667 — razão de massa molecular CO₂/C (CONSTANTE)
```

---

## 14. Motor de Cálculos — Módulo N₂O

> VM0042 v2.2 — Equações 16–31

### 14.1 Total N₂O do Solo (Eq. 16)

```
N2O_soil = N2O_fert + N2O_md + N2O_Nfix
```

### 14.2 N₂O por Fertilizantes — Emissão Direta (Eq. 17–19)

```
N2O_fert_direct = GWP_N2O × [SUM(F_sint × EF1) + SUM(F_org × EF1)] × (44/28) / (1000 × Area)

FSN = SUM(M_SF × NC_SF)   → fertilizantes sintéticos
FON = SUM(M_OF × NC_OF)   → fertilizantes orgânicos
```

**Fatores EF1 por clima:**

| Condição | EF1 (kg N₂O-N / kg N) |
|----------|----------------------|
| Solo mineral default | 0.01 |
| Com inibidor de nitrificação | 0.005 |
| Clima úmido tropical | 0.016 |
| Clima seco tropical | 0.005 |

**Teor de N — Fertilizantes Sintéticos (NC_SF):**

| Fertilizante | NC_SF |
|-------------|-------|
| Ureia | 0.46 |
| MAP | 0.11 |
| Sulfato de amônio | 0.21 |
| KCl | 0 |

**Teor de N — Fertilizantes Orgânicos (NC_OF):**

| Tipo | NC_OF |
|------|-------|
| Esterco bovino | 0.015 |
| Cama de frango | 0.030 |
| Composto | 0.020 |

### 14.3 N₂O — Emissão Indireta (Eq. 20–25)

**Volatilização (Eq. 22):**
```
N2O_vol = GWP_N2O × [SUM(F_sint × Frac_GASF) + SUM(F_org × Frac_GASM)] × EF4 × (44/28) / (1000 × Area)

Frac_GASF = 0.11 (sintético default) | 0.15 (ureia especificamente)
Frac_GASM = 0.21 (orgânico)
EF4       = 0.014 kg N₂O-N / kg (NH₃-N + NOx-N)
```

**Lixiviação (Eq. 23):**
```
N2O_leach = GWP_N2O × SUM(F_total × Frac_LEACH) × EF5 × (44/28) / (1000 × Area)

Frac_LEACH = 0.24  → clima úmido ou com irrigação
Frac_LEACH = 0     → clima seco sem irrigação
EF5        = 0.011 kg N₂O-N / kg N lixiviado
```

### 14.4 N₂O por Deposição de Esterco (Eq. 26–28)

```
N2O_md = GWP_N2O × SUM(Pop × Nex × AWMS × EF_N2O_md) × (44/28) / (1000 × Area)

Onde:
  Pop         = animais por tipo — INPUT_PRODUTOR
  Nex         = excreção anual N (kg N/cab/ano)
                Gado corte=40 | Gado leite=70 | Ovinos=12
  AWMS        = fração N manejado no sistema (pasto ≈ 1.0)
  MS          = fração depositada na área (= meses/12)
  EF_N2O_md   = 0.004 kg N₂O-N / kg N
```

### 14.5 N₂O por Fixação Biológica (Eq. 24–25)

```
N2O_Nfix = GWP_N2O × SUM(biomassa_leguminosa × N_content × EF_BNF) × (44/28) / (1000 × Area)

EF_BNF = 0.01 kg N₂O-N / kg N fixado

N_content (LOOKUP):
  Soja       = 0.030 tN/tMS
  Crotalária = 0.025 tN/tMS
  Feijão     = 0.028 tN/tMS
```

---

## 15. Motor de Cálculos — Módulo CH₄

> VM0042 v2.2 — Equações 11–14

### 15.1 CH₄ por Fermentação Entérica (Eq. 11)

```
CH4_ent = (GWP_CH4 × SUM(Pop_l × EF_ent_l)) / (1000 × Ai)

GWP_CH4 = 28 (CONSTANTE — IPCC AR5)
```

**Fatores EF_ent por tipo/sistema (IPCC Tier 1 América Latina):**

| Tipo de Animal | Sistema | EF_ent (kg CH₄/cab/ano) |
|----------------|---------|-------------------------|
| Gado corte | Extensivo | 56 |
| Gado corte | Semi-intensivo | 63 |
| Gado corte | Confinamento | 68 |
| Gado de leite | — | 83 |
| Ovinos | Todos | 5 |
| Caprinos | Todos | 5 |
| Equinos | Todos | 18 |

### 15.2 CH₄ por Deposição de Esterco (Eq. 12–13)

```
CH4_md = (GWP_CH4 × SUM(Pop × VS × AWMS × EF_CH4_md)) / (10^6 × Ai)

VS = VS_rate × (W / 1000) × 365

Onde:
  VS_rate    = 7.4 kg VS/(1000 kg massa animal × dia) — gado corte Am. Latina
  W          = peso médio (kg/cabeça) — INPUT_PRODUTOR ou default IPCC
  EF_CH4_md  = 1.0 g CH₄/kg VS — deposição em pasto
```

### 15.3 CH₄ por Queima de Biomassa (Eq. 14)

```
CH4_bb = (GWP_CH4 × SUM(MB_c × CF_c × EF_c,CH4)) / (10^6 × Ai)

Onde:
  MB_c      = massa resíduos queimados (kg MS) — estimado via HI
  CF_c      = 0.80 — fração de combustão (resíduos agrícolas) — IPCC Table 2.6
  EF_c,CH4  = 2.7 g CH₄/kg MS queimada (cereais/gramíneas) — IPCC Table 2.5
```

---

## 16. Motor de Cálculos — Módulo CO₂

### 16.1 CO₂ por Combustíveis Fósseis (Eq. 6–7 / Eq. 52)

```
CO2_ff = SUM(FFC_j × EF_CO2,j) / Ai

Onde:
  FFC_j    = consumo do combustível j (litros) — INPUT_PRODUTOR
  EF_CO2,j = fator de emissão (tCO₂e/litro):
             Diesel   = 0.002886
             Gasolina = 0.002310
             Etanol   = 0 (biogênico)
  Ai       = área do talhão (ha)
```

> Referência: aragem convencional ≈ 40–60 L/ha diesel; plantio direto ≈ 15–25 L/ha.

### 16.2 CO₂ por Calagem (Eq. 8–9 / Eq. 53)

```
EL = (M_Limestone × EF_Limestone + M_Dolomite × EF_Dolomite) × (44/12)

CO2_lime = EL / Ai

Onde:
  M_Limestone  = calcário calcítico aplicado (t/ano) — INPUT_PRODUTOR
  M_Dolomite   = dolomita aplicada (t/ano) — INPUT_PRODUTOR
  EF_Limestone = 0.12 tC/t calcário (CONSTANTE)
  EF_Dolomite  = 0.13 tC/t dolomita (CONSTANTE)
  Gesso (CaSO₄): EF = 0 — registrar separadamente, não gera CO₂
```

---

## 17. Cálculo de Créditos Líquidos

> VM0042 v2.2 — Equações 37–45

### 17.1 Reduções de Emissão (Eq. 37)

```
ER_t = delta_CO2_ff
     + delta_CO2_lime
     + delta_CH4_ent
     + delta_CH4_md
     + delta_CH4_bb
     + delta_CH4_soil × (1 - UNC_CH4)
     + delta_N2O_soil × (1 - UNC_N2O)
     + delta_N2O_bb

Cada delta = valor_baseline - valor_projeto
(positivo = redução de emissão = crédito)
```

### 17.2 Remoções de CO₂ (Eq. 40)

```
CR_t = (delta_CO2_soil_wp_t - delta_CO2_soil_bsl_t) × (1 - UNC_CO2 × I)

I = +1 se delta_CO2_soil_wp > delta_CO2_soil_bsl (aumento SOC)
I = -1 se delta_CO2_soil_wp ≤ delta_CO2_soil_bsl (perda SOC)
```

### 17.3 Dedução de Incerteza (Eq. 45 / Eq. 74)

```
UNC = (sqrt(s²) / delta_medio) × 100 × t_0.667

Onde:
  s²       = variância combinada (amostragem + modelo)
  t_0.667  = t-Student para 66.7% de confiança ≈ 0.4307
```

### 17.4 Créditos Líquidos Finais

```
CR_net_t  = CR_t - LK_CR_t
ERR_net_t = ER_t + CR_net_t - LK_t
VCUs_emitidos = ERR_net_t × (1 - buffer_pool_rate)

Onde:
  LK_t             = leakage (deslocamento de produção + importação de esterco)
  buffer_pool_rate = 10–20% — INPUT_ADMIN (AFOLU Non-Permanence Risk Tool)
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

**Propósito:** evitar dupla contagem (abordagem conservadora para simulação).

### Constantes do Simulador (`src/constants/simulador.ts`)

```typescript
BUFFER_POOL: 0.15
PTAX_FALLBACK: 5.65
SOC_FATOR_FALLBACK: 0.5    // tCO₂e/ha/ano se prática não mapeada
PRATICA_SECUNDARIA_MULT: 0.3  // desconto práticas 2ª em diante
CULTURA_BONUS_MULT: 0.2       // bônus por cultura selecionada
FC_MINIMO: 0.3               // fator mínimo aceitável
CUSTO_OP_BRL_HA: 15          // custo operacional referência (R$/ha)
PREMIO_VALUATION: 0.06       // 6% premium ESG
```

---

## 19. Painel do Parceiro — Comissões

### Fórmula de Comissão

**Ano 0 (assinatura do contrato):**
```
Comissao_ano0 = US$ 1.00/ha × area_elegivel × PTAX
```

**Anos 2, 4, 6, 8, 10 (baseado em resultados reais):**
```
Pm = (G_medio / 2) × US$ 1.00/ha × area_elegivel × PTAX

Onde:
  G_medio       = média de créditos gerados (tCO₂e/ha/ano) — VCUs líquidos
  area_elegivel = área elegível definida pelo Admin após análise
  PTAX          = USD/BRL no momento do cálculo (API BCB)
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

**QA1 (RothC):**
- Baseline = modelo rodando com práticas pré-projeto
- Não requer control site físico obrigatório
- Simula "mundo sem projeto" com mesmo solo e clima

**QA2 (Measure & Re-measure):**
- Baseline = control sites físicos
- **Obrigatório:** mínimo 3 control sites por projeto
- Pelo menos 1 por estrato
- Dentro de 250km das unidades de quantificação

### 20.2 Opções de Baseline

**Opção A — Baseline na própria fazenda:**
Uma área continua com manejo convencional. Admin define como `control_site`. Mesma estrutura de dados do talhão de projeto.

**Opção B — Baseline em propriedade externa:**
Fazenda vizinha ou área de referência. Admin cadastra separadamente, vinculando às unidades de quantificação. Deve estar a ≤250km e atender critérios de similaridade.

### 20.3 Cadastro de Control Site

Formulário multi-step (`AdminControlSiteForm.tsx` + `ControlSiteSteps.tsx`):

1. **Identificação:** nome, gestor, tipo de gestor, área
2. **Localização:** centroide lat/lng, distância à estação meteo
3. **Solo e Clima:** zona climática, ecorregião, textura, grupo WRB, declividade, precipitação
4. **SOC:** % médio, IC inferior/superior, número de amostras
5. **Histórico:** manejo últimos 5 anos, cobertura histórica, ano de conversão
6. **Vínculos:** fazendas e talhões vinculados

### 20.4 Visualização no Mapa

- Talhões de projeto → verde `#16A34A`
- Control sites → azul `#057A8F`
- Áreas excluídas (reserva legal, APP) → cinza `#9CA3AF`

### 20.5 Alertas Automáticos (Admin)

| Condição | Tipo | Ação |
|----------|------|------|
| CS Ativos < 3 | **Bloqueante** | Não pode verificar créditos |
| CS Ativos < 10 | Aviso | Alta incerteza na estimativa |
| Fazenda sem cobertura | Aviso | Executar matching |
| Dados climáticos >30 dias | Aviso | Atualizar via API ou manual |

---

## 21. Motor de Matching — 9 Critérios VM0042

**Arquivo:** `src/motor/matchingControlSite.ts`
**Entrada:** `ControlSite` + `Fazenda` + `Talhao[]`
**Saída:** `MatchResult` com score 0–100

### 9 Critérios e Pesos

| # | Critério | Exigência VM0042 | Implementação |
|---|---------|-----------------|---------------|
| C1 | Distância | ≤ 250km | Fórmula de Haversine entre centroides |
| C2 | Zona climática IPCC | Mesma zona | `zonaClimatica` string comparison |
| C3 | Ecorregião WWF | Mesma ecorregião | String comparison |
| C4 | Classe textural FAO (0–30cm) | Mesma classe | `ClasseTexturaFAO` enum |
| C5 | Grupo de solo WRB | Mesmo grupo | String comparison |
| C6 | Topografia (declividade + aspecto) | Mesma classe; aspecto ≤30° | `ClasseDeclividade` + aspecto diferença |
| C7 | Precipitação média anual | ±100mm MAR | Diferença absoluta |
| C8 | SOC% médio | t-test α=0.10 — não significativamente diferente | t-test com IC inferior/superior |
| C9 | Histórico ALM | Mesmas práticas últimos 5 anos | Interseção de arrays |

### Score de Matching

```
score = (critérios_aprovados / 9) × 100

statusCobertura:
  "coberta"   → score ≥ 78 (≥7/9 critérios)
  "parcial"   → score ≥ 44 (≥4/9 critérios)
  "descoberta"→ score < 44
```

---

## 22. Componentes de Mapa

### 22.1 BrasilFazendasMap (`src/components/maps/BrasilFazendasMap.tsx`)

**Uso:** AdminDashboard — mapa de distribuição nacional das fazendas

**Props:**
```typescript
interface BrasilFazendasMapProps {
  fazendas: Fazenda[]
  talhoes: Talhao[]
  clientes: Cliente[]
  onFazendaClick?: (fazendaId: string) => void
  height?: string    // default "442px"
}
```

**Tecnologia:** MapLibre GL 5.24.0 com tiles CartoDB `light_all`

**Features:**
- Clustering (`cluster: true`, `clusterMaxZoom: 11`)
  - Click em cluster → `getClusterExpansionZoom()` (retorna `Promise<number>` no MapLibre 5.x) → `easeTo()`
- Layers:
  - `cluster-glow`, `clusters` (círculos clusterizados)
  - `cluster-count` (texto com count)
  - `unclustered` (fazendas individuais a zoom alto)
  - `unclustered-label` (nome da fazenda, `minzoom: 9`)
  - `poly-fill` + `poly-outline` (polígono de área, `minzoom: 6`)
- Popup rico ao hover: área, talhões, zona, status MRV, produtor, CTA "Ver MRV"
- Click em ponto/polígono → `onClickRef.current(id)` (padrão ref para closure fresca)
- 22 fazendas mock em `initial-data.ts` cobrindo todas as regiões do Brasil

**Coordenadas dos municípios:** `MUNICIPIO_COORDS` lookup para 22 municípios + `UF_COORDS` fallback por estado

**Polígono de área:**
```typescript
function makePolygon(lat, lng, areaHa): number[][][] {
  // Gera quadrado aproximado baseado na área em ha
  // 1 grau lat ≈ 111km → offset = sqrt(areaHa / 10000) / 1.11 graus
}
```

> **ATENÇÃO:** No MapLibre 5.x, eventos de hover devem ser registrados em **TODAS** as layers sobrepostas. Se a layer de label (`symbol`) estiver acima da layer de circle, ela intercepta `mouseenter`. Registrar eventos em ambas as layers.

### 22.2 FazendaMap (`src/components/maps/FazendaMap.tsx`)

**Uso:** MrvPage (cliente), AdminFazendaDetalhe

**Props:**
```typescript
interface FazendaMapProps {
  talhoes: Talhao[]
  height?: string    // default "300px" ou "100%"
  kmlGeoJson?: FeatureCollection  // sobrepõe KML carregado
}
```

**Tecnologia:** MapLibre GL com tiles OSM raster

**Cores por tipo de talhão:**
- `projeto` → `#16A34A` (verde)
- `control_site` → `#057A8F` (azul primário)
- `excluido` → `#9CA3AF` (cinza)

**Layout na MrvPage:**
```
lg: [30% KmlUploader h-full] [70% FazendaMap height="100%"]
```

### 22.3 KmlUploader (`src/components/maps/KmlUploader.tsx`)

**Props:**
```typescript
interface KmlUploaderProps {
  onLoad: (result: { areaHa: number; geojson: FeatureCollection; fileName: string }) => void
  label?: string
  className?: string   // aceita "h-full" para esticar à altura do mapa
}
```

**Parser KML:** `DOMParser` nativo (zero dependências extras)
**Cálculo de área:** `@turf/area` sobre os polígonos parseados

**Estados internos:** `idle` | `loading` | `ok` | `error`

---

## 23. Banco de Fatores e Constantes

### 23.1 Fatores SOC por Prática (Simulador)

Fonte: Embrapa, IPCC 2019, Cerri et al., Bayer et al.
Usar ponto médio da faixa como default; limite inferior com incerteza.

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

| Constante | Valor | Fonte |
|-----------|-------|-------|
| GWP_CH₄ | 28 tCO₂e/tCH₄ | IPCC AR5 (req. Verra) |
| GWP_N₂O | 265 tCO₂e/tN₂O | IPCC AR5 (req. Verra) |
| Conversão C → CO₂ | 44/12 = 3.667 | Peso molecular |
| Conversão N₂O-N → N₂O | 44/28 = 1.571 | Peso molecular |
| Fração C na matéria seca vegetal | 0.45 | Default IPCC |
| EF_diesel | 0.002886 tCO₂e/litro | VM0042 v2.2 |
| EF_gasolina | 0.002310 tCO₂e/litro | IPCC Table 3.3.1 |
| EF_limestone (CaCO₃) | 0.12 tC/t calcário | IPCC Section 11.3 |
| EF_dolomite | 0.13 tC/t dolomita | IPCC Section 11.3 |
| EF1_N₂O default | 0.01 kg N₂O-N/kg N | IPCC 2019 |
| EF4_N₂O volatilização | 0.014 | IPCC 2019 |
| EF5_N₂O lixiviação | 0.011 | IPCC 2019 |
| Frac_GASF sintético | 0.11 | IPCC 2019 |
| Frac_GASF ureia | 0.15 | IPCC 2019 |
| Frac_GASM orgânico | 0.21 | IPCC 2019 |
| Frac_LEACH úmido/irrigado | 0.24 | IPCC 2019 |
| Frac_LEACH seco sem irrigação | 0 | IPCC 2019 |
| Fator leakage | 0.05 | VM0054 |
| Buffer pool estimado | 10–20% | AFOLU Risk Tool |
| Preço crédito simulador | US$ 20/tCO₂e | Referência Venture (admin editável) |
| k_DPM | 10.0 ano⁻¹ | RothC fixo |
| k_RPM | 0.3 ano⁻¹ | RothC fixo |
| k_BIO | 0.66 ano⁻¹ | RothC fixo |
| k_HUM | 0.02 ano⁻¹ | RothC fixo |
| k_IOM | 0 | RothC fixo |

### 23.3 Harvest Index e Razão Raiz:Parte Aérea por Cultura

| Cultura | HI | Raiz:PA | N_content (tN/tMS) | Observação |
|---------|----|---------|--------------------|------------|
| Soja | 0.42 | 0.20 | 0.030 | Leguminosa fixadora |
| Milho | 0.50 | 0.22 | — | |
| Trigo | 0.40 | 0.24 | — | |
| Arroz | 0.45 | 0.20 | — | |
| Sorgo | 0.35 | 0.22 | — | |
| Algodão | 0.35 | 0.20 | — | |
| Cana-de-açúcar | 0.50 (açúcar) | 0.15 | — | Palha como resíduo |
| Café | 0.30 | 0.30 | — | Perene, input C contínuo |
| Brachiaria (cobertura) | n/a | 1.60 | — | Toda biomassa → input C |
| Crotalária | n/a | 0.40 | 0.025 | Leguminosa fixadora |
| Pastagem (Brachiaria) | n/a | 1.60 | — | Alto input C por raízes |

---

## 24. Parâmetros Globais do Sistema

**Arquivo:** `src/store/initial-data.ts` — array `parametros: ParametroSistema[]`

O sistema possui **47 parâmetros** pré-configurados, editáveis via `AdminParametros.tsx` usando `setParametro(chave, valor, fonte?)`. Recuperados com `getParam(chave)`.

**Categorias:**

| Categoria | Exemplos | Editável pelo Admin |
|-----------|---------|-------------------|
| Financeiros | `preco_base_usd`, `ptax_fallback`, `buffer_pool`, `comissao_base_usd_ha` | ✓ |
| GWP | `gwp_ch4`, `gwp_n2o` | Read-only |
| EF N₂O | `ef1_n2o_default`, `ef1_n2o_inibidor`, `ef1_n2o_umido`, `ef1_n2o_seco` | ✓ (com fonte) |
| EF CO₂ Combustíveis | `ef_diesel`, `ef_gasolina` | ✓ (com fonte) |
| EF Calagem | `ef_limestone`, `ef_dolomite` | Read-only |
| Fatores SOC | `soc_fator_spdpd`, `soc_fator_cobertura`, etc. (8 fatores) | ✓ |
| Frações N₂O | `frac_gasf`, `frac_gasm`, `frac_leach`, `ef4_n2o_volat`, `ef5_n2o_leach` | Read-only |
| Leakage | `fator_leakage` | ✓ |

---

## 25. Inputs por Perfil e Tela

### Legenda de Tipos de Input

| Código | Descrição |
|--------|-----------|
| `INPUT_PRODUTOR` | Digitado ou selecionado pelo produtor |
| `INPUT_ADMIN` | Inserido pela equipe Venture Carbon |
| `CALC_AUTO` | Calculado automaticamente pelo sistema |
| `API_EXTERNA` | Obtido de fonte externa (BCB, INMET) |
| `CONSTANTE` | Valor fixo da metodologia, não editável |
| `LOOKUP` | Selecionado automaticamente conforme regra |

### Resumo de Responsabilidade por Dado

| Dado | Quem insere | Onde | Criticidade |
|------|-------------|------|-------------|
| Nome, telefone, email | Produtor | Simulador Step 5 / Criação de conta | Alta |
| Área (ha) / KML | Produtor | Simulador Step 2 / MRV aba Mapa | Alta |
| Cultura, manejo, datas | Produtor | Simulador Step 3–4 / MRV Lavoura | Alta |
| Produtividade (sacas/ha) | Produtor | MRV Lavoura | Média |
| Irrigação, queima | Produtor | MRV Lavoura | Média |
| Animais, sistema, quantidade | Produtor | MRV Pecuária | Média |
| Peso médio animal | Produtor (ou default IPCC) | MRV Pecuária | Baixa |
| Tipo e qtd fertilizante | Produtor | MRV Fertilização | Alta |
| Uso de inibidor | Produtor | MRV Fertilização | Média |
| Tipo e qtd calcário | Produtor | MRV Fertilização | Média |
| Diesel por operação | Produtor | MRV Operacional | Média |
| SOC%, BD, %argila, profundidade | Admin | Talhão (dados de solo) | **CRÍTICO** |
| Temp/precip/evap mensais | Admin ou API | Dados climáticos do talhão | **CRÍTICO** |
| PTAX do dia | API BCB | Automático (fallback 5.65) | Alta |
| buffer_pool_rate | Admin | Parâmetros globais | Alta |
| EFs (substituição) | Admin | Parâmetros globais | Alta |

---

## 26. Regras de Negócio Gerais

### Conservadorismo (VM0042 v2.2 Section 8.6.3)

- Quando emissões **diminuem** no projeto vs. baseline: usar EF que resulte na **menor redução** (valor inferior da faixa IPCC)
- Quando emissões **aumentam** no projeto: usar EF que resulte na **maior emissão** (valor superior)

### Frequência de Monitoramento

| Item | Frequência | Obrigatoriedade |
|------|-----------|----------------|
| Medição de SOC | A cada 5 anos mínimo | Obrigatória QA1 e QA2 |
| Dados ALM (manejo) | Anual | Attestation + evidência |
| Dados climáticos | Mensal | Alimenta RothC |
| Fatores de emissão | A cada 5 anos | Atualizar com melhor EF |
| Verificação de créditos | 1–5 anos | Por VVB credenciada |

### Baseline e Reassessment

- Baseline reavaliado a cada 10 anos (recomendado a cada 5 — VM0042 v2.2)
- Plataforma suporta múltiplos períodos de baseline por projeto

### Travamento e Versionamento de Dados

- Dados aprovados pelo Admin são travados (imutáveis) — campo `dadosValidados: true`
- Todo travamento registra: timestamp (`socTimestamp`), ID do Admin, versão (`versao`)
- Histórico de versões via `historicoFazendas: EventoHistorico[]` (append-only)

### Invalidação de Cache Zustand

Ao alterar `initialState()` no `src/store/initial-data.ts`, **incrementar a `version`** do persist:
```typescript
// src/store/data.ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'venture-carbon-store',
    version: 5,           // ← incrementar quando mudar initial-data
    migrate: () => initialState(),  // limpa localStorage com dados antigos
  }
)
```

### Sidebar — Scrollbar Oculta

`AuthLayout.tsx` aplica em `<nav>`:
```tsx
className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
```
Padrão aplicado em **todos os perfis** (cliente, parceiro, admin).

### Fases Deferidas (Fora do Escopo do MVP)

Os itens abaixo **não devem ser desenvolvidos no MVP:**
- Backend Node.js/Express (motor roda no frontend por enquanto)
- Integração direta com MapBiomas
- App mobile nativo
- WhatsApp API
- Automação QGIS
- Digital Soil Mapping (VT0014)
- Autenticação real (JWT/bcrypt) — sistema usa auth mock

O MVP foca no **fluxo web completo:** Simulação → MRV → Parceiros → Admin.

---

* WYRE · Guia Técnico v4.0 · VM0042 v2.2 | VMD0053 v2.1 | VT0014 v1.0 | RothC-26.3 · Abril 2026 · Confidencial*
