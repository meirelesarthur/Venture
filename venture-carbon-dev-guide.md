# Venture Carbon — Guia de Desenvolvimento
> Sistema Web Responsivo · React · VM0042 v2.2 · RothC-26.3
> Versão 2.0 · Marco 2026 · Confidencial

---

## Índice
1. [Design System](#1-design-system)
2. [Arquitetura e Stack](#2-arquitetura-e-stack)
3. [Perfis de Usuário](#3-perfis-de-usuário)
4. [Rotas do Sistema](#4-rotas-do-sistema)
5. [Fluxo 1 — Simulador (Lead)](#5-fluxo-1--simulador-lead)
6. [Fluxo 2 — MRV Digital (Cliente)](#6-fluxo-2--mrv-digital-cliente)
7. [Fluxo 3 — Painel do Parceiro](#7-fluxo-3--painel-do-parceiro)
8. [Fluxo 4 — Admin Venture Carbon](#8-fluxo-4--admin-venture-carbon)
9. [Motor de Cálculos — Módulo RothC](#9-motor-de-cálculos--módulo-rothc)
10. [Motor de Cálculos — Módulo N₂O](#10-motor-de-cálculos--módulo-n₂o)
11. [Motor de Cálculos — Módulo CH₄](#11-motor-de-cálculos--módulo-ch₄)
12. [Motor de Cálculos — Módulo CO₂](#12-motor-de-cálculos--módulo-co₂)
13. [Cálculo de Créditos Líquidos](#13-cálculo-de-créditos-líquidos)
14. [Fórmulas do Simulador](#14-fórmulas-do-simulador)
15. [Painel do Parceiro — Comissões](#15-painel-do-parceiro--comissões)
16. [Control Sites e Baseline](#16-control-sites-e-baseline)
17. [Banco de Fatores e Constantes](#17-banco-de-fatores-e-constantes)
18. [Inputs por Perfil e Tela](#18-inputs-por-perfil-e-tela)
19. [Regras de Negócio Gerais](#19-regras-de-negócio-gerais)

---

## 1. Design System

### Tokens Fundamentais

```css
/* Tipografia */
font-family: 'Poppins', sans-serif;
/* Importar via Google Fonts */
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

### Componentes Base

- **Botão primário:** background `#057A8F`, texto branco, border-radius 8px, peso 600
- **Botão secundário:** border `1px solid #057A8F`, texto `#057A8F`, background transparente
- **Input:** border `1px solid #D1D5DB`, focus `border-color: #057A8F`, border-radius 6px
- **Card:** background `#FFFFFF`, border-radius 12px, box-shadow leve
- **Badge de status:** pill com cores semânticas (success/warning/danger/muted)
- **Progress bar:** fill `#057A8F`, track `#D1D5DB`

---

## 2. Arquitetura e Stack

### Frontend

```
React 18+ com TypeScript
React Router v6 — roteamento SPA
React Hook Form — formulários
Zustand ou Context API — estado global
Leaflet ou Mapbox GL JS — mapas e KML
Recharts — gráficos (barras, linhas)
Axios — chamadas HTTP
date-fns — manipulação de datas
```

### Backend

```
Node.js + Express (ou NestJS)
PostgreSQL — banco relacional
Prisma ORM
Redis — cache de taxa de câmbio (PTAX) e dados climáticos
JWT — autenticação
Bcrypt — hash de senhas
```

### Integrações Externas

| Serviço | Dado | Frequência |
|---------|------|-----------|
| API BCB (Banco Central) | `PTAX_venda_dia` (R$/USD) | Diária |
| INMET ou estação meteorológica ≤50km | Temperatura, precipitação, evaporação mensais | Mensal ou manual |
| MapBiomas | Histórico de cobertura (fase futura) | — |

### Boas Práticas React

- Componentes funcionais + hooks exclusivamente
- Separação clara: `pages/`, `components/`, `hooks/`, `services/`, `store/`, `utils/`
- Cálculos do simulador executados **no frontend** em tempo real (sem chamada API)
- Motor RothC + QA3 executado **no backend** (processamento pesado)
- Lazy loading de rotas com `React.lazy` + `Suspense`
- Formulários multi-step com estado persistido (localStorage ou Context) para não perder dados em navegação
- Mapas isolados em componentes próprios com cleanup de instâncias no `useEffect`
- Dados numéricos sensíveis (créditos, comissões) sempre formatados com `Intl.NumberFormat`
- Validação dupla: frontend (UX) + backend (segurança)

---

## 3. Perfis de Usuário

### 3.1 Lead (não autenticado)
Acessa apenas `/simulacao`. Não possui conta. Após resultado, pode criar conta (vira Cliente) ou falar com consultor.

### 3.2 Cliente (Produtor)
Usuário autenticado que representa uma ou mais fazendas. Submete dados de lavoura, pecuária, fertilização e operações para o MRV. Pode visualizar resultados e histórico de créditos.

**Permissões:**
- Leitura e edição dos próprios dados antes da aprovação do Admin
- Visualização de resultados, VCUs e timeline do projeto
- Upload de documentos e fotos georreferenciadas
- Não pode aprovar nem travar dados

### 3.3 Parceiro
Usuário autenticado que indica leads (produtores) para a Venture Carbon. Possui painel de acompanhamento de comissões.

**Permissões:**
- Cadastrar novos leads
- Visualizar status dos leads indicados
- Ver extrato de comissões projetadas e realizadas
- Ver ranking anônimo de parceiros

### 3.4 Admin (Equipe Venture Carbon)
Usuário interno com acesso total. Valida dados, insere laudos laboratoriais, configura parâmetros e gerencia control sites.

**Permissões:**
- Aprovar, rejeitar ou solicitar correção de qualquer dado
- Travar dados validados (imutáveis após travamento, versionados com timestamp)
- Inserir dados de solo (laudo), climáticos e de campo
- Cadastrar e gerenciar control sites
- Editar parâmetros globais (preço base USD, buffer_pool, EFs)
- Substituir EF default por fator projeto-específico (com fonte e justificativa registradas)
- Acessar todos os clientes, parceiros e leads
- Disparar motor de cálculos e visualizar resultados detalhados

---

## 4. Rotas do Sistema

```
/                           → Redirect baseado em perfil (ou landing)
/simulacao                  → Simulador público (Lead) — 5 telas em wizard

/login                      → Login universal
/recuperar-senha            → Recuperação de senha
/criar-conta                → Cadastro de Cliente (vindo do simulador)

/dashboard                  → Dashboard do Cliente (após login)
/dashboard/fazenda/:id      → Visão geral de fazenda específica
/dashboard/talhao/:id       → Detalhes e inputs de um talhão
/dashboard/mrv              → Área de submissão de dados (MRV)
/dashboard/mrv/lavoura      → Dados de lavoura
/dashboard/mrv/pecuaria     → Dados de pecuária
/dashboard/mrv/fertilizacao → Dados de fertilização
/dashboard/mrv/operacional  → Dados operacionais (combustível, queima)
/dashboard/mrv/documentos   → Upload de documentos
/dashboard/resultados       → VCUs estimados, histórico de créditos
/dashboard/perfil           → Dados cadastrais do produtor

/parceiro                   → Dashboard do Parceiro
/parceiro/leads/novo        → Formulário de novo lead
/parceiro/leads             → Lista de leads e status
/parceiro/comissoes         → Extrato de comissões
/parceiro/ranking           → Ranking anônimo e metas

/admin                      → Painel Admin — visão geral
/admin/clientes             → Lista de clientes
/admin/clientes/:id         → Ficha completa do cliente
/admin/leads                → Todos os leads
/admin/leads/:id            → Detalhe do lead e elegibilidade
/admin/parceiros            → Lista de parceiros
/admin/control-sites        → Gerenciamento de control sites
/admin/control-sites/novo   → Cadastrar control site
/admin/parametros           → Parâmetros globais (preço, buffer, EFs)
/admin/motor/:fazendaId     → Disparar e ver resultado do motor de cálculos
```

---

## 5. Fluxo 1 — Simulador (Lead)

**URL pública:** `/simulacao`
**Execução:** cálculo 100% no frontend, em tempo real.
**Wizard de 5 telas** — progresso exibido em steps.

---

### Tela 1 — Gate de Cadastro

**Objetivo:** capturar o lead antes de mostrar qualquer resultado.

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome | text | ✓ |
| Telefone | tel (máscara BR) | ✓ |
| Email | email | ✓ |

**Ação:** `[Começar Simulação]` → avança para Tela 2. Dados salvos como lead no banco imediatamente.

---

### Tela 2 — Área da Propriedade

**Opção A:** Upload de arquivo `.kml`
- Sistema renderiza perímetro no mapa (Leaflet/Mapbox)
- Sistema calcula área total em hectares automaticamente

**Opção B:** Campo numérico manual
- Input: `área (ha)` — número decimal positivo

| Variável | Tipo de Input | Unidade | Usa em |
|----------|--------------|---------|--------|
| `hectares` | `INPUT_PRODUTOR` | ha | Fórmula do Simulador |

---

### Tela 3 — Cultura e Manejo Atual

**Objetivo:** alimentar a árvore de elegibilidade rápida.

**Seleção múltipla de culturas** (lista pré-definida):
`soja, milho, algodão, cana, café, pasto, trigo, arroz, sorgo, outros`

**Para cada cultura selecionada**, coletar manejo dos últimos 3 anos:

| Variável | Tipo | Opções |
|----------|------|--------|
| `tipo_preparo` | select | Convencional / Reduzido / Plantio Direto |
| `usa_cobertura` | boolean | Sim / Não |
| `usa_org` | boolean | Sim / Não |
| `tem_pecuaria` | boolean | Sim / Não |

#### Árvore de Decisão de Elegibilidade Rápida

```
Se produtor já faz TODAS as práticas regenerativas há > 3 anos:
  → Exibir flag: "Sua fazenda pode ter elegibilidade limitada"
  → Continua simulação com aviso visível
Caso contrário (faz parte ou nenhuma):
  → Prossegue normalmente sem aviso
```

---

### Tela 4 — Práticas Desejadas (Cálculo em Tempo Real)

**Lista de checkboxes — 15 práticas regenerativas** (usar fatores SOC da seção 17).

A cada checkbox marcado/desmarcado, o sistema **recalcula imediatamente** a estimativa usando a fórmula do simulador (seção 14).

**Seletor de horizonte:** `10 anos` | `20 anos`

---

### Tela 5 — Resultado

**Exibe:**
- Estimativa de receita total (R$) no horizonte selecionado
- tCO₂e estimadas por ano
- Valor por hectare por ano (R$/ha/ano)
- Gráfico de barras: receita projetada ano a ano
- Comparativo: custo manejo convencional vs. regenerativo
- Texto fixo: *"Custo para você: R$ 0 — Venture arca com todos os custos"*

**CTAs:**
- `[Falar com Consultor]` → abre WhatsApp ou email
- `[Criar Conta Completa]` → redireciona para `/criar-conta`

---

## 6. Fluxo 2 — MRV Digital (Cliente)

**URL:** `/dashboard` e sub-rotas `/dashboard/mrv/*`

### Dashboard do Cliente

- Barra de progresso geral (% de completude das 6 fases do MRV)
- Mapa interativo da fazenda com talhões clicáveis
- Projeção financeira estimada (com dados já inseridos)
- Alertas de pendências

---

### Área de Submissão de Dados — Organização por Categoria

#### 6.1 Dados de Lavoura (por talhão)

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `cultura` | seleção de lista | — | HI, DPM/RPM, N_content, fator c |
| `data_plantio` | seletor de data (dd/mm) | — | Fator c (cobertura RothC) |
| `data_colheita` | seletor de data (dd/mm) | — | Fator c (cobertura RothC) |
| `produtividade` | numérico (sacas/ha ou t/ha) | sacas/ha ou t/ha | Input C vegetal via HI, biomassa leguminosas |
| `usa_irrigacao` | boolean + tipo | — | `Frac_LEACH` (Eq. 23) |
| `queima_residuos` | boolean | — | `CH4_bb` (Eq. 14), `N2O_bb` (Eq. 32) |

**Cálculos automáticos após inserção:**
- Input de carbono vegetal via Harvest Index (seção 9.9)
- Vetor mensal de cobertura do solo (c = 0.6 vegetado | c = 1.0 exposto) — baseado nas datas de plantio/colheita

---

#### 6.2 Dados de Pecuária (se aplicável)

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `tipo_animal` | seleção (gado corte, gado leite, ovinos, caprinos, equinos) | — | `EF_ent` (Eq.11), `Nex` (Eq.28), `VS_rate` (Eq.13) |
| `sistema_producao` | seleção (extensivo, semi-intensivo, confinamento) | — | `EF_ent` (Eq.11) |
| `quantidade_animais` | numérico inteiro | cabeças | `Pop` nas Eq. 11, 12, 28 |
| `peso_medio` | numérico (ou default IPCC Table 10A.5) | kg/cabeça | `W` em Eq. 13 → VS |
| `tempo_permanencia` | numérico | meses/ano | `MS` em Eq. 28 (= meses/12) |

**Cálculos automáticos:**
- CH₄ entérico (Eq. 11 VM0042) — seção 11.1
- CH₄ e N₂O por esterco (Eq. 12-13, 26-28) — seções 11.2 e 10.4

---

#### 6.3 Dados de Fertilização

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `tipo_fertilizante_sint` | seleção (Ureia, MAP, DAP, Sulfato amônio, NPK) | — | `NC_SF` → Eq. 19, `Frac_GASF` → Eq. 22 |
| `qtd_fertilizante_sint` | numérico | kg/ha | `M_SF` → Eq. 19 |
| `usa_inibidor` | boolean | — | `EF_Ndirect`: 0.01 → 0.005 |
| `tipo_fertilizante_org` | seleção (esterco bovino, cama frango, composto, vinhaça) | — | `NC_OF` → Eq. 20, `Frac_GASM` → Eq. 22 |
| `qtd_fertilizante_org` | numérico | t/ha | `M_OF` → Eq. 20 |
| `tipo_calcario` | seleção (calcítico, dolomítico, gesso) | — | `M_Limestone` ou `M_Dolomite` → Eq. 9 |
| `qtd_calcario` | numérico | t/ha | Eq. 9 (gesso = 0 CO₂) |

**Cálculos automáticos:**
- N₂O direto + indireto (Eq. 16-25) — seção 10
- CO₂ calagem (Eq. 9/53) — seção 12.2

---

#### 6.4 Dados Operacionais

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `operacoes_mecanizadas` | seleção múltipla (aragem, gradagem, plantio, pulverização, colheita, transporte) | — | `FFC` → Eq. 7 |
| `combustivel_tipo` | seleção por operação (diesel, gasolina, etanol) | — | `EF_CO2,j` → Eq. 7 |
| `combustivel_litros` | numérico (ou horas-máquina + tipo para estimativa) | litros | `FFC` → Eq. 7 |

**Cálculo automático:** CO₂ fóssil (Eq. 52) — seção 12.1

---

#### 6.5 Dados de Solo (inseridos pelo Admin)

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `SOC_percent` | laudo laboratorial (combustão seca, lab ISO/IEC 17025) | % | `SOC_stock` (2.1.10), `IOM` (2.1.8) |
| `BD` | medição de campo (anel volumétrico ISO 11272:2017) | g/cm³ | `SOC_stock` (2.1.10) |
| `argila_percent` | laudo laboratorial | % | `TSMD` (2.1.4), particionamento (2.1.6) |
| `profundidade_cm` | registro de campo | cm | `SOC_stock`, `TSMD ajustado` — mínimo 30cm |

---

#### 6.6 Dados Climáticos (por município/estação ≤50km)

| Variável | Input | Unidade | Cálculo Alimentado |
|----------|-------|---------|-------------------|
| `temp_mensal[1..12]` | API ou inserção manual (12 valores jan-dez) | °C | Fator a do RothC (2.1.3) |
| `precip_mensal[1..12]` | API ou manual | mm/mês | TSMD (2.1.4), `Frac_LEACH` (Eq. 23) |
| `evap_mensal[1..12]` | API (Penman-Monteith) ou tanque Classe A | mm/mês | TSMD (2.1.4) |
| `zona_climatica_IPCC` | LOOKUP automático por município | — | `EF_Ndirect`, `Frac_LEACH`, Table 7 VM0042 |

**Zona climática:** Tropical úmido (precipitação >1000mm/ano) ou Tropical seco (<1000mm/ano). Determinado automaticamente pelas coordenadas GPS.

---

### Fluxo de Aprovação de Dados

```
Produtor submete dados
       ↓
Status: "Pendente validação"
       ↓
Admin Venture revisa
       ↓
    ┌──────────────────┐
    │                  │
 Aprova            Solicita Correção
    │                  │
    ↓                  ↓
Dado TRAVA        Notificação → Produtor
(versionado       resubmete
 com timestamp)
    ↓
Motor de Cálculos executa
```

---

### Motor de Cálculos (Backend — Automático)

Com todos os dados validados e travados, o backend executa:

1. **Baseline** — RothC + QA3 com práticas pré-projeto
2. **Projeto** — RothC + QA3 com práticas regenerativas
3. **Delta** = Projeto − Baseline (para cada fonte de emissão)
4. Dedução de incerteza (VMD0053 / Eq. 45)
5. Dedução do buffer pool
6. **= VCUs líquidos**

---

## 7. Fluxo 3 — Painel do Parceiro

**URL:** `/parceiro`

### Dashboard do Parceiro

- Resumo: total de leads indicados, total de hectares, comissão projetada
- Ranking anônimo (posição relativa, sem nomes de outros parceiros)
- Premiações: próximo marco de indicações/conversões

---

### Cadastrar Novo Lead

**URL:** `/parceiro/leads/novo`

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome do produtor | text | ✓ |
| Telefone | tel | ✓ |
| Email | email | ✓ |
| Nome da fazenda | text | ✓ |
| Município | text + estado | ✓ |
| Área estimada | numérico (ha) | ✓ |
| Cultura principal | seleção | ✓ |
| Manejo atual | seleção | ✓ |
| Upload KML | arquivo | Opcional |

**Ação:** `[Enviar Indicação]`

---

### Status dos Leads

Pipeline de status visível por lead:

```
Em análise → Aprovado → Contratado → Em monitoramento
                                ↘ Recusado (com motivo)
```

---

### Comissão por Lead

Ver seção 15 para fórmulas completas.

Exibir por lead contratado:
- Comissão Ano 0
- Comissões Anos 2, 4, 6, 8, 10 (projetadas)
- Total projetado em 10 anos por lead
- Total projetado do portfólio completo

---

## 8. Fluxo 4 — Admin Venture Carbon

**URL:** `/admin`

### Responsabilidades Principais

- Validar e aprovar dados submetidos por clientes
- Inserir dados laboratoriais de solo (SOC%, BD, %argila, profundidade)
- Inserir ou vincular dados climáticos (manual ou API)
- Cadastrar e gerenciar control sites
- Editar parâmetros globais do motor
- Disparar motor de cálculos e interpretar resultados
- Gerenciar leads e elegibilidade
- Monitorar parceiros e comissões

### Parâmetros Globais Editáveis pelo Admin

| Parâmetro | Default | Descrição |
|-----------|---------|-----------|
| Preço base USD | US$ 20/tCO₂e | Multiplicado pelo PTAX para `preco_credito_BRL` |
| `buffer_pool` | 0.15 (15%) | Percentual retido como buffer de permanência |
| `buffer_pool_rate` | 10–20% | Definido pela análise de risco AFOLU Non-Permanence Risk Tool |
| EFs default | ver seção 17 | Substituíveis por fatores projeto-específicos (com fonte + justificativa) |

### Regra de Substituição de EF

Admin pode substituir qualquer EF default. Ao substituir, o sistema exige:
- **Fonte:** publicação peer-reviewed ou inventário nacional MCTI
- **Justificativa:** campo texto obrigatório
- **Hierarquia de preferência (VM0042 v2.2):**
  1. Fator projeto-específico de publicação peer-reviewed
  2. Fator Tier 2 de fonte alternativa robusta (ex: MCTI)
  3. Fator Tier 2 derivado de dados do projeto
  4. Fator Tier 1 IPCC 2019 Refinement (default mínimo)

---

## 9. Motor de Cálculos — Módulo RothC

> RothC-26.3 — Quantification Approach 1 (SOC)
> Executa mensalmente para cada talhão, em dois cenários: Baseline e Projeto.

### 9.1 Decomposição Mensal de Compartimento

**Operação em 4 compartimentos ativos:** DPM, RPM, BIO, HUM. IOM não decompõe (k=0).

```
Y_final = Y × exp(-a × b × c × k × t)

Material decomposto no mês = Y × (1 - exp(-a × b × c × k × t))

Onde:
  Y = estoque atual no compartimento (tC/ha) — CALC_AUTO
  a = fator de temperatura — ver 9.3
  b = fator de umidade via TSMD — ver 9.4
  c = fator de cobertura do solo — ver 9.5
  k = constante de decomposição do compartimento (ano⁻¹)
  t = 1/12 (passo mensal fixo — CONSTANTE)
```

### 9.2 Constantes de Decomposição (k)

| Compartimento | Descrição | k (ano⁻¹) |
|---------------|-----------|-----------|
| `k_DPM` | Material vegetal decomponível | 10.0 |
| `k_RPM` | Material vegetal resistente | 0.3 |
| `k_BIO` | Biomassa microbiana | 0.66 |
| `k_HUM` | Matéria orgânica humificada | 0.02 |
| `k_IOM` | Matéria orgânica inerte | 0 (não decompõe) |

Todos são `CONSTANTE` — não editáveis pelo usuário.

### 9.3 Fator de Temperatura (a)

```
a = 47.9 / (1 + exp(106 / (T + 18.27)))

Onde:
  T = temperatura média mensal do ar (°C) — API_EXTERNA ou INPUT_ADMIN
  47.9, 106, 18.27 = constantes fixas do modelo RothC
```

**Input real:** 12 valores mensais de temperatura (°C) para o município. Via API automática prioritariamente; se manual, Admin insere os 12 valores na ficha climática do talhão. Estação meteorológica deve estar a ≤50km (requisito VM0042 Table 6/8).

### 9.4 Fator de Umidade (b) via TSMD

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
  Solo reidrata até Acc_TSMD = 0
```

**Passo 5 — Calcular fator b:**
```
Se Acc_TSMD >= 0.444 × Max_TSMD:
  b = 1.0
Caso contrário:
  b = 0.2 + (1.0 - 0.2) × (Max_TSMD - Acc_TSMD) / (Max_TSMD - 0.444 × Max_TSMD)
```

**Inputs necessários:**
- `%argila` — INPUT_ADMIN (laudo laboratorial)
- `profundidade_cm` — INPUT_ADMIN — mínimo 30cm
- `precipitacao[1..12]` — API_EXTERNA ou INPUT_ADMIN (mm/mês)
- `evaporacao[1..12]` — API_EXTERNA ou INPUT_ADMIN (mm/mês)

### 9.5 Fator de Cobertura do Solo (c)

```
c = 0.6  → solo vegetado (entre data_plantio e data_colheita)
c = 1.0  → solo exposto
```

Sistema monta automaticamente vetor de 12 meses com base nas datas de plantio/colheita inseridas. Se houver safrinha/cobertura, meses de transição são cobertos (c = 0.6).

**Inputs:** `data_plantio` e `data_colheita` — INPUT_PRODUTOR (dd/mm)

### 9.6 Particionamento CO₂ vs (BIO+HUM) por %Argila

```
x = 1.67 × (1.85 + 1.60 × exp(-0.0786 × %argila))

Fração perdida como CO₂    = x / (x + 1)
Fração retida como BIO+HUM = 1 / (x + 1)

Do BIO+HUM formado:
  46% → BIO
  54% → HUM
```

**Input:** `%argila` — mesmo valor já coletado para TSMD.

### 9.7 Razão DPM/RPM por Tipo de Input Vegetal

| Tipo de Vegetal | DPM/RPM | DPM% | RPM% | Observação |
|-----------------|---------|------|------|------------|
| Culturas agrícolas / pastagem melhorada | 1.44 | 59% | 41% | LOOKUP por cultura |
| Pastagem não melhorada / savana | 0.67 | 40% | 60% | LOOKUP |
| Floresta decídua/tropical | 0.25 | 20% | 80% | LOOKUP |
| FYM (esterco/compostagem) | — | 49% | 49% | + 2% HUM direto |

LOOKUP automático baseado no tipo de cultura e manejo selecionados pelo produtor.

### 9.8 IOM — Matéria Orgânica Inerte

```
IOM = 0.049 × TOC^1.139   (Falloon et al., 1998)

Onde:
  TOC = carbono orgânico total medido (tC/ha) — INPUT_ADMIN via laudo
        (análise por combustão seca, convertido de % para tC/ha usando BD e profundidade)
```

### 9.9 Input de Carbono Vegetal via Harvest Index

```
biomassa_parte_aerea = (Yield / HI) - Yield

biomassa_raizes = biomassa_parte_aerea × razao_raiz_parte_aerea

input_C_total = (biomassa_parte_aerea + biomassa_raizes) × 0.45

Onde:
  Yield    = produtividade da cultura (t MS/ha) — INPUT_PRODUTOR em sacas/ha ou t/ha
             (sistema converte para t MS/ha internamente)
  HI       = Harvest Index — LOOKUP por cultura (ver seção 17.3)
  razao_raiz_parte_aerea = LOOKUP por cultura (ver seção 17.3)
  0.45     = fração de C na matéria seca vegetal (CONSTANTE — default IPCC)
```

`input_C_total` é distribuído mensalmente conforme o ciclo da cultura (concentrado nos meses de crescimento ativo).

### 9.10 Estoque de SOC (Inicialização do Modelo)

```
SOC_stock (tC/ha) = (SOC% / 100) × BD × profundidade_cm × 100

Equivalente:
SOC_stock = SOC% × BD (Mg/m³) × profundidade (m) × 10000 / 100

Onde:
  SOC%          = porcentagem de C orgânico no solo — INPUT_ADMIN (laudo)
  BD            = densidade aparente (g/cm³ = Mg/m³) — INPUT_ADMIN (medição campo)
  profundidade  = profundidade de amostragem (cm) — mínimo 30cm, recomendado 50cm
```

> ⚠️ **CRÍTICO:** SOC%, BD e profundidade são os dados mais importantes do projeto. Inicializam o modelo RothC. Coleta: ISO 18400-104. Laudo: laboratório ISO/IEC 17025.

### 9.11 Conversão SOC → CO₂

```
CO₂ (tCO₂e/ha) = delta_SOC (tC/ha) × (44/12)

delta_SOC = SOC no tempo t+1 - SOC no tempo t
44/12 = razão de massa molecular CO₂ / C (CONSTANTE)
```

---

## 10. Motor de Cálculos — Módulo N₂O

> QA3, VM0042 Equações 16–31

### 10.1 Total N₂O do Solo (Eq. 16)

```
N2O_soil = N2O_fert + N2O_md + N2O_Nfix
```

### 10.2 N₂O por Fertilizantes — Emissão Direta (Eq. 17–19)

```
N2O_fert_direct = GWP_N2O × [SUM(F_sintetico × EF1) + SUM(F_organico × EF1_org)] × (44/28) / (1000 × Area)

Para cada fertilizante sintético:
  F_sintetico (kg N/ha) = quantidade_aplicada (kg/ha) × %N_no_fertilizante

FSN = SUM(M_SF × NC_SF)   → para cada tipo de fertilizante sintético
FON = SUM(M_OF × NC_OF)   → para cada tipo de fertilizante orgânico
```

**Fatores de emissão direta EF1 (LOOKUP por clima):**

| Condição | EF1 (kg N₂O-N / kg N) |
|----------|----------------------|
| Solo mineral default | 0.01 |
| Com inibidor de nitrificação | 0.005 |
| Clima úmido tropical | 0.016 |
| Clima seco tropical | 0.005 |

**Teor de N por fertilizante (NC_SF — LOOKUP):**

| Fertilizante | NC_SF (t N / t fertilizante) |
|-------------|------------------------------|
| Ureia | 0.46 |
| MAP | 0.11 |
| Sulfato de amônio | 0.21 |
| KCl | 0 |

**Teor de N orgânico (NC_OF — LOOKUP):**

| Tipo | NC_OF |
|------|-------|
| Esterco bovino | 0.015 |
| Cama de frango | 0.030 |
| Composto | 0.020 |

### 10.3 N₂O por Fertilizantes — Emissão Indireta (Eq. 20–25)

**Volatilização (Eq. 22):**
```
N2O_vol = GWP_N2O × [SUM(F_sint × Frac_GASF) + SUM(F_org × Frac_GASM)] × EF4 × (44/28) / (1000 × Area)

Frac_GASF = 0.11 (sintético default) | 0.15 (ureia)
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

**Total fertilizantes:**
```
N2O_fert = N2O_fert_direct + N2O_vol + N2O_leach
```

> O produtor deve indicar se usa **irrigação** (sim/não + tipo). Determina `Frac_LEACH`. Zona climática determina `EF_Ndirect` e `Frac_LEACH` automaticamente.

### 10.4 N₂O por Deposição de Esterco (Eq. 26–28)

```
N2O_md = GWP_N2O × SUM(Pop × Nex × AWMS × EF_N2O_md) × (44/28) / (1000 × Area)

F_manure = Pop × Nex × AWMS × MS

Onde:
  Pop    = número de animais por tipo — INPUT_PRODUTOR
  Nex    = excreção anual de N por cabeça (kg N/cabeça/ano) — LOOKUP:
           Gado corte = 40 | Gado leite = 70 | Ovinos = 12
  AWMS   = fração do N manejado no sistema (pasto = ~1.0) — LOOKUP
  MS     = fração do N depositada na área (= meses_permanencia / 12)
           Default conservador = 1.0
  EF_N2O_md = 0.004 kg N₂O-N / kg N (deposição direta em pasto)
```

### 10.5 N₂O por Fixação Biológica (Eq. 24–25)

```
N2O_Nfix = GWP_N2O × SUM(biomassa_leguminosa × N_content × EF_BNF) × (44/28) / (1000 × Area)

F_CR = SUM(MB_g × N_content_g)

EF_BNF = 0.01 kg N₂O-N / kg N fixado

N_content (LOOKUP):
  Soja        = 0.030 tN/tMS
  Crotalária  = 0.025 tN/tMS
  Feijão      = 0.028 tN/tMS
```

Biomassa calculada via Harvest Index (mesmo processo de 9.9).

---

## 11. Motor de Cálculos — Módulo CH₄

> QA3, VM0042 Equações 11–14

### 11.1 CH₄ por Fermentação Entérica (Eq. 11)

```
CH4_ent = (GWP_CH4 × SUM(Pop_l × EF_ent_l,P)) / (1000 × Ai)

Onde:
  Pop_l   = população de animais tipo l — INPUT_PRODUTOR
  EF_ent  = fator de emissão entérica — LOOKUP (kg CH₄/cabeça/ano)
  GWP_CH4 = 28 (CONSTANTE — IPCC AR5)
  Ai      = área do talhão (ha)
  1000    = conversão kg → t
```

**Fatores EF_ent por tipo/sistema (IPCC Tier 1 América Latina):**

| Tipo de Animal | Sistema | EF_ent (kg CH₄/cab/ano) |
|----------------|---------|-------------------------|
| Gado corte | Extensivo (pasto, baixa produtividade) | 56 |
| Gado corte | Semi-intensivo (pasto melhorado + suplementação) | 63 |
| Gado corte | Confinamento | 68 |
| Gado de leite | — | 83 |
| Ovinos | Todos | 5 |
| Caprinos | Todos | 5 |
| Equinos | Todos | 18 |

**Interação com o produtor:** Seleção de tipo animal + sistema de produção + quantidade. EF selecionado automaticamente.

### 11.2 CH₄ por Deposição de Esterco (Eq. 12–13)

```
CH4_md = (GWP_CH4 × SUM(Pop × VS × AWMS × EF_CH4_md)) / (10^6 × Ai)

VS = VS_rate × (W / 1000) × 365

Onde:
  VS_rate = taxa de excreção de sólidos voláteis — LOOKUP
            Gado corte Am. Latina = 7.4 kg VS/(1000 kg massa animal × dia)
  W       = peso médio do animal (kg/cabeça) — INPUT_PRODUTOR ou default IPCC
  EF_CH4_md = 1.0 g CH₄/kg VS (deposição em pasto) — LOOKUP
  10^6    = conversão gramas → toneladas
```

### 11.3 CH₄ por Queima de Biomassa (Eq. 14)

```
CH4_bb = (GWP_CH4 × SUM(MB_c × CF_c × EF_c,CH4)) / (10^6 × Ai)

Onde:
  MB_c       = massa de resíduos tipo c queimados (kg MS) — INPUT_PRODUTOR
               (produtor informa: queima resíduos? Se sim: tipo + área queimada
                Biomassa estimada a partir do HI)
  CF_c       = fração de combustão = 0.80 (resíduos agrícolas) — LOOKUP IPCC Table 2.6
  EF_c,CH4   = 2.7 g CH₄/kg MS queimada (cereais/gramíneas) — LOOKUP IPCC Table 2.5
```

---

## 12. Motor de Cálculos — Módulo CO₂

> QA3, VM0042

### 12.1 CO₂ por Combustíveis Fósseis (Eq. 6–7 / Eq. 52)

```
CO2_ff = SUM(FFC_j × EF_CO2,j) / Ai

Onde:
  FFC_j    = consumo de combustível tipo j no talhão i (litros) — INPUT_PRODUTOR
  EF_CO2,j = fator de emissão (tCO₂e/litro) — LOOKUP:
             Diesel   = 0.002886
             Gasolina = 0.002310
             Etanol   = 0 (biogênico, não contabilizado)
  Ai       = área do talhão (ha)
```

> Referência comparativa: aragem convencional ≈ 40–60 L/ha diesel; plantio direto ≈ 15–25 L/ha. Redução gera crédito.

### 12.2 CO₂ por Calagem (Eq. 8–9 / Eq. 53)

```
EL = (M_Limestone × EF_Limestone + M_Dolomite × EF_Dolomite) × (44/12)

CO2_lime = EL / Ai

Onde:
  M_Limestone = quantidade de calcário calcítico (CaCO₃) aplicada (t/ano) — INPUT_PRODUTOR
  M_Dolomite  = quantidade de dolomita (CaMg(CO₃)₂) aplicada (t/ano) — INPUT_PRODUTOR
  EF_Limestone = 0.12 tC/t calcário — CONSTANTE (IPCC Section 11.3)
  EF_Dolomite  = 0.13 tC/t dolomita — CONSTANTE
  Gesso (CaSO₄): EF = 0 (não libera CO₂) — registrar separadamente
```

---

## 13. Cálculo de Créditos Líquidos

> VM0042 Equações 37–45

### 13.1 Reduções de Emissão (Eq. 37)

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
(positivo = redução de emissão)
```

Todos os deltas calculados automaticamente. Nenhum input adicional do produtor.

### 13.2 Remoções de CO₂ (Eq. 40)

```
CR_t = (delta_CO2_soil_wp_t - delta_CO2_soil_bsl_t) × (1 - UNC_CO2 × I)

I = +1 se delta_CO2_soil_wp > delta_CO2_soil_bsl (aumento SOC — remoção)
I = -1 se delta_CO2_soil_wp <= delta_CO2_soil_bsl (perda SOC — emissão)
```

### 13.3 Dedução de Incerteza (Eq. 45 / Eq. 74)

```
UNC = (sqrt(s²) / delta_medio) × 100 × t_0.667

Onde:
  s²       = variância combinada (amostragem + modelo) — CALC_AUTO
  t_0.667  = valor t-Student para 66.7% de confiança ≈ 0.4307
```

Para RothC (QA1): incerteza vem do Model Prediction Error.
Para QA2: incerteza vem da variância das medições.

```
delta_CO2_wp_t = delta_CO2_soil_wp_t × (1 - UNC_CO2 × I(delta_CO2_soil))
               + delta_C_TREE + delta_C_SHRUB
```

### 13.4 Créditos Líquidos Finais

```
CR_net_t  = CR_t - LK_CR_t
ERR_net_t = ER_t + CR_net_t - LK_t
VCUs_emitidos = ERR_net_t × (1 - buffer_pool_rate)

Onde:
  LK_t          = leakage (deslocamento de produção + importação de esterco) — CALC_AUTO
  buffer_pool_rate = 10–20% — INPUT_ADMIN (AFOLU Non-Permanence Risk Tool)
```

---

## 14. Fórmulas do Simulador

> Executadas 100% no frontend, em tempo real, sem chamada API.

```
receita_anual = SUM(hectares × fator_SOC[pratica_i]) × preco_credito_BRL × (1 - buffer_pool)

receita_total = receita_anual × horizonte_anos

preco_credito_BRL = preco_base_USD × PTAX_venda_dia
                  = 20 × PTAX_venda_dia

buffer_pool = 0.15  (default conservador — editável pelo Admin)
```

### Variáveis do Simulador

| Variável | Tipo | Descrição | Observação |
|----------|------|-----------|------------|
| `hectares` | INPUT_PRODUTOR | Área total (ha) | Via KML ou digitação |
| `fator_SOC[pratica_i]` | LOOKUP | Fator médio de sequestro SOC por prática (tCO₂e/ha/ano) | Ver tabela na seção 17.1 |
| `preco_credito_BRL` | CALC_AUTO | R$/tCO₂e | = 20 × PTAX (parâmetro admin editável) |
| `PTAX_venda_dia` | API_EXTERNA (BCB) | Taxa de câmbio USD venda do dia | Atualizada diariamente |
| `buffer_pool` | CONSTANTE/Admin | Percentual retido como buffer | Default = 0.15 (15%) |
| `horizonte_anos` | INPUT_PRODUTOR | 10 ou 20 anos | Seleção pelo produtor |

### Regra de Combinação de Práticas

Quando o produtor seleciona múltiplas práticas, os fatores **NÃO são somados linearmente**. Aplica-se:

```
fator_combinado = maior_fator_individual + 0.30 × soma_dos_demais_fatores

Exemplo:
  Prática A = 2.5 tCO₂e/ha/ano
  Prática B = 1.8 tCO₂e/ha/ano
  fator_combinado = 2.5 + (1.8 × 0.30) = 3.04 tCO₂e/ha/ano
```

**Propósito:** evitar dupla contagem (abordagem conservadora para simulação).

---

## 15. Painel do Parceiro — Comissões

### Fórmula de Comissão

**Ano 0 (assinatura do contrato):**
```
Comissao_ano0 = US$ 1.00/ha × area_elegivel × PTAX
```

**Anos 2, 4, 6, 8, 10 (baseado em resultados reais):**
```
Pm = (G_medio / 2) × US$ 1.00/ha × area_elegivel × PTAX

Onde:
  G_medio      = média de créditos gerados (tCO₂e/ha/ano) nos anos anteriores
                 = média dos VCUs líquidos efetivamente emitidos para aquela fazenda
  area_elegivel = área elegível do lead contratado (CALC_AUTO pós-análise admin)
  PTAX         = taxa USD/BRL no momento do cálculo (API BCB)
```

**Variáveis:**

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `area_elegivel` | CALC_AUTO | Definida após análise de elegibilidade pelo Admin |
| `PTAX` | API_EXTERNA (BCB) | Convertido no momento do pagamento |
| `G_medio` | CALC_AUTO (motor) | Média dos créditos líquidos emitidos para a fazenda |

---

## 16. Control Sites e Baseline

### 16.1 Tipos de Baseline Suportados

**QA1 (RothC):**
- Baseline = modelo rodando com práticas pré-projeto
- Não requer obrigatoriamente control site físico
- Modelo simula "mundo sem projeto" com mesmo solo e clima

**QA2 (Measure & Re-measure):**
- Baseline = control sites físicos
- **Obrigatório:** mínimo 3 control sites por projeto
- Pelo menos 1 por estrato
- Dentro de 250km das unidades de quantificação

### 16.2 Opções de Baseline

**Opção A — Baseline na própria fazenda:**
Uma área da fazenda continua com manejo convencional como referência. Admin define essa área como "control site" vinculado à fazenda. Mesma estrutura de dados do talhão de projeto.

**Opção B — Baseline em propriedade externa:**
Fazenda vizinha ou área de referência (ex: estação experimental). Admin cadastra separadamente, vinculando às unidades de quantificação. Deve estar a ≤250km e atender critérios de similaridade.

### 16.3 Critérios de Similaridade (Table 7 VM0042 v2.2)

| Critério | Exigência | Verificação na Plataforma |
|----------|-----------|--------------------------|
| Topografia | Mesma classe de declive (6 classes, Appendix 5) | Campo: seleção de classe (plano, ondulado, montanhoso) |
| Textura do solo | Mesma classe textural FAO (0–30cm mínimo) | Campo: resultado análise de solo |
| Grupo de solo | Mesmo grupo de referência FAO WRB | Campo select |
| SOC% médio | Não significativamente diferente a 90% de confiança (t-test) | CALC_AUTO pelo motor |
| Histórico ALM | Mesmas práticas nos últimos 5 anos (tillage, resíduos, culturas, adubo) | Campos: práticas dos últimos 3 anos |
| Cobertura histórica | Mesmo tipo nos últimos 50 anos (±10 anos) | Via imagem de satélite ou atestado |
| Ecorregião | Mesma ecorregião WWF | LOOKUP por coordenadas |
| Zona climática | Mesma zona IPCC | Automático por coordenadas GPS |
| Precipitação | Dentro de ±100mm MAR | Estação met ≤50km |
| Distância | Máximo 250km | Cálculo automático entre KMLs |
| Declive > "hilly" | Aspecto dentro de 30° | Campo adicional |

### 16.4 Mínimos de Control Sites

| Parâmetro | Valor | Fonte |
|-----------|-------|-------|
| Mínimo absoluto | 3 control sites por projeto | VM0042 Section 8.2 |
| Mínimo por estrato | 1 control site por estrato | VM0042 Section 8.2 |
| Recomendado | ≥10 control sites | Reduz incerteza |

**Alerta no dashboard Admin:** quando número de control sites for inferior a 10.

### 16.5 Visualização no Mapa

- **Talhões de projeto** → cor verde (`#16A34A`)
- **Control sites** → cor azul (`#057A8F`)
- **Áreas excluídas** (reserva legal, APP) → cor cinza (`#9CA3AF`)

Admin pode clicar em qualquer control site e ver: solo, manejo, coletas e resultados (mesma estrutura do talhão de projeto).

---

## 17. Banco de Fatores e Constantes

### 17.1 Fatores SOC por Prática (Simulador)

Fonte: Embrapa, IPCC 2019, Cerri et al., Bayer et al.
Usar ponto médio da faixa como default; limite inferior com incerteza.

| Prática | Faixa (tCO₂e/ha/ano) | Default |
|---------|---------------------|---------|
| Plantio direto (SPD) — eliminação da aragem, manutenção de palhada | 1.5 – 3.5 | **2.5** |
| Planta de cobertura (Brachiaria, Crotalária, Milheto, Aveia) | 1.0 – 4.0 | **2.0** |
| Rotação de culturas — diversificação sequencial | 0.5 – 2.0 | **1.2** |
| ILPF / ILP — Integração Lavoura-Pecuária(-Floresta) | 2.0 – 6.0 | **3.5** |
| Reforma de pastagem — recuperação de pasto degradado | 2.0 – 5.0 | **3.0** |
| Adubação orgânica — esterco, compostagem, vinhaça | 0.5 – 2.5 | **1.5** |
| Biológicos/inoculantes — micorriza, Trichoderma, fixadores | 0.3 – 1.5 | **0.8** |
| Manejo de pastagem rotacionado com adubação | 1.0 – 3.0 | **1.8** |

### 17.2 Constantes Globais do Motor

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
| Buffer pool estimado | 10–20% | AFOLU Risk Tool |
| Preço crédito simulador | US$ 20/tCO₂e | Referência Venture (admin editável) |
| k_DPM | 10.0 ano⁻¹ | RothC fixo |
| k_RPM | 0.3 ano⁻¹ | RothC fixo |
| k_BIO | 0.66 ano⁻¹ | RothC fixo |
| k_HUM | 0.02 ano⁻¹ | RothC fixo |
| k_IOM | 0 | RothC fixo |

### 17.3 Harvest Index e Razão Raiz:Parte Aérea por Cultura

| Cultura | HI | Raiz:PA | N_content (tN/tMS) | Observação |
|---------|----|---------|--------------------|------------|
| Soja | 0.42 | 0.20 | 0.030 | Leguminosa fixadora |
| Milho | 0.50 | 0.22 | — | |
| Trigo | 0.40 | 0.24 | — | |
| Arroz | 0.45 | 0.20 | — | |
| Sorgo | 0.35 | 0.22 | — | |
| Algodão | 0.35 | 0.20 | — | |
| Cana-de-açúcar | 0.50 (açúcar) | 0.15 | — | Considerar palha como resíduo |
| Café | 0.30 | 0.30 | — | Perene, input C anual contínuo |
| Brachiaria (cobertura) | n/a (sem colheita) | 1.60 | — | Toda biomassa vira input C |
| Crotalária | n/a | 0.40 | 0.025 | Leguminosa fixadora |
| Pastagem (gênero Brachiaria) | n/a | 1.60 | — | Alto input C por raízes |

---

## 18. Inputs por Perfil e Tela

### Legenda de Tipos de Input

| Código | Descrição |
|--------|-----------|
| `INPUT_PRODUTOR` | Dado digitado ou selecionado pelo produtor |
| `INPUT_ADMIN` | Dado inserido pela equipe Venture Carbon |
| `CALC_AUTO` | Calculado automaticamente pelo sistema |
| `API_EXTERNA` | Obtido de fonte externa (BCB, INMET) |
| `CONSTANTE` | Valor fixo da metodologia, não editável |
| `LOOKUP` | Selecionado automaticamente pelo sistema conforme regra |

### Resumo de Responsabilidade por Dado

| Dado | Quem insere | Onde | Criticidade |
|------|-------------|------|-------------|
| Nome, telefone, email | Produtor | Simulador Tela 1 / Criação de conta | Alta |
| Área (ha) / KML | Produtor | Simulador Tela 2 / MRV | Alta |
| Cultura, manejo, datas | Produtor | Simulador Tela 3–4 / MRV Lavoura | Alta |
| Produtividade (sacas/ha) | Produtor | MRV Lavoura | Média |
| Irrigação, queima | Produtor | MRV Lavoura | Média |
| Animais, sistema, quantidade | Produtor | MRV Pecuária | Média |
| Peso médio animal | Produtor (ou default IPCC) | MRV Pecuária | Baixa |
| Tipo e qtd fertilizante | Produtor | MRV Fertilização | Alta |
| Uso de inibidor | Produtor | MRV Fertilização | Média |
| Tipo e qtd calcário | Produtor | MRV Fertilização | Média |
| Diesel por operação | Produtor | MRV Operacional | Média |
| SOC%, BD, %argila, profundidade | Admin | Ficha de solo do talhão | **CRÍTICO** |
| Temp/precip/evap mensais | Admin ou API | Ficha climática | **CRÍTICO** |
| PTAX do dia | API BCB | Automático | Alta |
| buffer_pool_rate | Admin | Parâmetros globais | Alta |
| EFs (substituição) | Admin | Parâmetros globais | Alta |

---

## 19. Regras de Negócio Gerais

### Conservadorismo (VM0042 v2.2 Section 8.6.3)

- Quando emissões **diminuem** no projeto vs. baseline (redução): usar EF que resulte na **menor redução** (valor inferior da faixa IPCC)
- Quando emissões **aumentam** no projeto: usar EF que resulte na **maior emissão** (valor superior da faixa)

### Frequência de Monitoramento

| Item | Frequência | Obrigatoriedade |
|------|-----------|----------------|
| Medição de SOC | A cada 5 anos (mínimo) | Obrigatória para QA1 e QA2 |
| Dados ALM (manejo) | Anual | Attestation do produtor + evidência |
| Dados climáticos | Mensal (contínuo) | Alimenta RothC |
| Fatores de emissão | A cada 5 anos | Atualizar quando disponível melhor EF |
| Verificação de créditos | 1–5 anos | Por VVB credenciada |

### Baseline e Reassessment

- Baseline reavaliado a cada 10 anos (recomendado a cada 5 anos — VM0042 v2.2)
- Schedule of activities fixado ex ante e repetido ao longo do primeiro período de baseline
- Plataforma suporta múltiplos períodos de baseline por projeto

### Travamento e Versionamento de Dados

- Dados aprovados pelo Admin são travados (imutáveis)
- Todo travamento registra: timestamp, ID do Admin, versão
- Histórico de versões deve ser auditável

### Alertas de Dashboard (Admin)

- Control sites < 3: **bloqueante** (não pode verificar créditos)
- Control sites < 10: **aviso** (alta incerteza)
- Dados climáticos desatualizados (>30 dias): **aviso**
- PTAX não atualizado: **aviso**

### Fases Deferidas (fora do escopo do MVP)

Os itens abaixo foram acordados para fases futuras e **não devem ser desenvolvidos no MVP:**
- Integração direta com MapBiomas
- App mobile nativo
- WhatsApp API
- Automação QGIS
- Digital Soil Mapping (VT0014)

O MVP foca no **fluxo web completo:** Simulação → MRV → Parceiros → Admin.

---

*Venture Carbon · Manual Técnico v2.0 · VM0042 v2.2 | VMD0053 v2.1 | VT0014 v1.0 | RothC-26.3 · Março 2026 · Confidencial*
