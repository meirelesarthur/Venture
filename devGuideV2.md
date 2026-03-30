# Venture Carbon — Plano de Implantação Completo
> Briefing para Vibe Coding · VM0042 v2.2 | RothC-26.3 | VMD0053 v2.1  
> Versão 1.0 · Março 2026 · Confidencial

---

## Índice

1. [Visão Geral da Plataforma](#1-visão-geral-da-plataforma)
2. [Design System](#2-design-system)
3. [Arquitetura Técnica](#3-arquitetura-técnica)
4. [Modelos de Dados (Entidades)](#4-modelos-de-dados-entidades)
5. [Regras de Negócio e Cálculos](#5-regras-de-negócio-e-cálculos)
6. [Perfis de Usuário e Permissões](#6-perfis-de-usuário-e-permissões)
7. [Jornada 1 — Simulador de Leads](#7-jornada-1--simulador-de-leads)
8. [Jornada 2 — MRV Digital (Cliente)](#8-jornada-2--mrv-digital-cliente)
9. [Jornada 3 — Painel do Parceiro](#9-jornada-3--painel-do-parceiro)
10. [Jornada 4 — Painel Admin (Venture Carbon)](#10-jornada-4--painel-admin-venture-carbon)
11. [Motor de Cálculos Backend](#11-motor-de-cálculos-backend)
12. [Integrações Externas](#12-integrações-externas)
13. [Fases de Implementação (MVP Roadmap)](#13-fases-de-implementação-mvp-roadmap)

---

## 1. Visão Geral da Plataforma

A **Venture Carbon** é uma plataforma SaaS de MRV (Monitoramento, Reporte e Verificação) de créditos de carbono para o agronegócio brasileiro. Opera conforme as metodologias Verra VM0042 v2.2 (redução de emissões em lavouras) e RothC-26.3 (modelo bioquímico de carbono do solo).

### 1.1 Quatro Perfis de Uso

| Perfil | Acesso | Objetivo |
|--------|--------|----------|
| **Lead (não autenticado)** | URL pública `/simulacao` | Estimar receita com créditos de carbono |
| **Produtor/Cliente** | Login autenticado | Inserir dados de MRV, acompanhar créditos gerados |
| **Parceiro** | Login autenticado | Indicar leads, acompanhar comissões |
| **Admin Venture** | Login privilegiado | Validar dados, gerir projetos, configurar motor |

### 1.2 Fluxo Macro

```
Lead acessa /simulacao
  → Simulação rápida (cálculo frontend, sem RothC)
    → Resultado estimado → CTA "Criar Conta" ou "Falar com Consultor"

Produtor cria conta / Admin cadastra
  → Dashboard cliente (6 fases de MRV)
    → Submissão dados → Validação admin → Dados travados
      → Motor roda RothC + QA3 (backend)
        → VCUs líquidos calculados

Parceiro indica lead → Admin analisa → Aprovado → Monitorado
  → Comissões calculadas em Ano 0 e Anos 2,4,6,8,10
```

---

## 2. Design System

### 2.1 Tokens CSS Fundamentais

```css
/* Importar via Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

:root {
  /* Tipografia */
  --font-primary: 'Poppins', sans-serif;

  /* Paleta principal */
  --color-primary:    #057A8F;   /* destaque, CTAs, links ativos */
  --color-background: #EEEEF1;   /* fundo geral de páginas */
  --color-surface:    #FFFFFF;   /* cards, modais, painéis */
  --color-text:       #1A1A2E;   /* texto principal */
  --color-muted:      #6B7280;   /* labels, placeholders */
  --color-success:    #16A34A;
  --color-warning:    #D97706;
  --color-danger:     #DC2626;

  /* Mapa — cores de camada */
  --map-project:      #16A34A;   /* talhões de projeto = verde */
  --map-control:      #057A8F;   /* control sites = azul */
  --map-excluded:     #9CA3AF;   /* reserva legal, APP = cinza */

  /* Superfície e sombras */
  --shadow-card: 0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
  --radius-card: 12px;
  --radius-btn:  8px;
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

### 2.3 Componentes Base

#### Botões
```css
/* Primário */
.btn-primary {
  background: #057A8F;
  color: #FFFFFF;
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
}

/* Secundário */
.btn-secondary {
  background: transparent;
  color: #057A8F;
  border: 1px solid #057A8F;
  border-radius: 8px;
  font-weight: 600;
  padding: 10px 20px;
}

/* Danger */
.btn-danger {
  background: #DC2626;
  color: #FFFFFF;
  border-radius: 8px;
  font-weight: 600;
}
```

#### Inputs
```css
.input {
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  padding: 10px 14px;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  color: #1A1A2E;
  transition: border-color 0.15s;
}
.input:focus {
  outline: none;
  border-color: #057A8F;
  box-shadow: 0 0 0 3px rgba(5,122,143,0.15);
}
```

#### Cards
```css
.card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 24px;
}
```

#### Badges de Status
```css
.badge { border-radius: 999px; padding: 2px 10px; font-size: 0.75rem; font-weight: 500; }
.badge-success  { background: #DCFCE7; color: #16A34A; }
.badge-warning  { background: #FEF3C7; color: #D97706; }
.badge-danger   { background: #FEE2E2; color: #DC2626; }
.badge-muted    { background: #F3F4F6; color: #6B7280; }
.badge-primary  { background: #E0F2F7; color: #057A8F; }
```

#### Progress Bar
```css
.progress-track { background: #D1D5DB; border-radius: 999px; height: 8px; }
.progress-fill  { background: #057A8F; border-radius: 999px; height: 100%; transition: width 0.3s; }
```

### 2.4 Padrões de Layout

- **Sidebar fixa** (240px) + conteúdo principal para dashboards autenticados
- **Largura máxima do conteúdo:** 1200px, centralizado
- **Grid de cards:** `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- **Formulários multi-step:** barra de progresso no topo (steps numerados)
- **Mapa:** altura mínima 420px, ocupando toda a largura do container

---

## 3. Arquitetura Técnica

### 3.1 Stack Recomendada

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Next.js 14+ (App Router) | SSR/SSG, rotas por perfil, excelente DX |
| Mapa | Leaflet.js com React-Leaflet | Open source, suporte a KML, layers customizáveis |
| Formulários | React Hook Form + Zod | Validação robusta, tipagem end-to-end |
| UI | Tailwind CSS + componentes próprios conforme design system | |
| Backend | Node.js + Express (ou Next.js API Routes) | |
| Motor de Cálculos | Python (FastAPI) — serviço isolado | Bibliotecas científicas (NumPy, SciPy) para RothC |
| Banco de dados | PostgreSQL com PostGIS | Suporte a geometria KML/shapefile |
| Auth | NextAuth.js com JWT + refresh tokens | Roles: lead, produtor, parceiro, admin |
| Storage | S3-compatible (ex: Supabase Storage ou AWS S3) | KML, laudos, fotos georreferenciadas |
| Background jobs | BullMQ (Redis) | Execução assíncrona do motor RothC |
| Cache | Redis | PTAX, dados climáticos |

### 3.2 Diagrama de Serviços

```
Browser (Next.js)
  │
  ├── API Routes / Express
  │     ├── Auth service
  │     ├── Lead/Projeto service
  │     ├── Partner service
  │     └── Admin service
  │           │
  │           ├── PostgreSQL + PostGIS
  │           ├── Redis (cache PTAX + clima)
  │           └── S3 (KML, docs, fotos)
  │
  └── Python Motor de Cálculos (FastAPI)
        ├── RothC engine
        ├── QA3 engine (N2O, CH4, CO2)
        └── Simulador rápido
              │
              ├── BCB API (PTAX)
              └── INMET / Weather API (clima)
```

### 3.3 Segurança

- HTTPS obrigatório em todos os endpoints
- Rate limiting no simulador público (evitar scraping de preços)
- Dados de MRV aprovados são **imutáveis** (append-only com versionamento + timestamp)
- Auditoria: log de todas as ações de admin com usuário + timestamp
- LGPD: dados de lead coletados com consentimento explícito

---

## 4. Modelos de Dados (Entidades)

### 4.1 `leads`

```sql
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  telefone        TEXT NOT NULL,
  email           TEXT NOT NULL,
  nome_fazenda    TEXT,
  municipio       TEXT,
  estado          TEXT,
  area_ha         NUMERIC(12,4),       -- área total digitada ou via KML
  kml_url         TEXT,                -- S3 URL do KML (opcional)
  culturas        TEXT[],              -- lista de culturas selecionadas
  manejo_atual    JSONB,               -- {tipo_preparo, usa_cobertura, usa_org, tem_pecuaria}
  praticas_desejadas TEXT[],           -- práticas marcadas no simulador
  horizonte_anos  INT CHECK (horizonte_anos IN (10,20)),
  receita_estimada NUMERIC(14,2),      -- R$ calculado no simulador
  tco2e_estimado  NUMERIC(12,4),       -- tCO2e/ano estimado
  status          TEXT DEFAULT 'novo', -- novo | em_analise | aprovado | contratado | recusado
  motivo_recusa   TEXT,
  parceiro_id     UUID REFERENCES parceiros(id),
  criado_em       TIMESTAMPTZ DEFAULT now(),
  atualizado_em   TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 `produtores` (Clientes)

```sql
CREATE TABLE produtores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id),
  nome            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  telefone        TEXT,
  cpf_cnpj        TEXT,
  endereco        JSONB,
  status_conta    TEXT DEFAULT 'ativo',
  criado_em       TIMESTAMPTZ DEFAULT now()
);
```

### 4.3 `fazendas`

```sql
CREATE TABLE fazendas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produtor_id     UUID REFERENCES produtores(id),
  nome            TEXT NOT NULL,
  municipio       TEXT NOT NULL,
  estado          TEXT NOT NULL,
  area_total_ha   NUMERIC(12,4),
  kml_url         TEXT,
  geom            GEOMETRY(MultiPolygon, 4326), -- PostGIS
  zona_climatica_ipcc TEXT,  -- 'tropical_umido' | 'tropical_seco' (auto via coordenadas)
  ecorregiao_wwf  TEXT,      -- preenchida automaticamente via coordenadas
  criado_em       TIMESTAMPTZ DEFAULT now()
);
```

### 4.4 `talhoes` (Unidades de Quantificação)

```sql
CREATE TABLE talhoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id      UUID REFERENCES fazendas(id),
  nome            TEXT,                -- ex: "Talhão A1"
  area_ha         NUMERIC(12,4) NOT NULL,
  geom            GEOMETRY(Polygon, 4326),
  tipo            TEXT DEFAULT 'projeto', -- 'projeto' | 'control_site' | 'excluido'
  -- Solo (inserido pelo admin após laudo)
  soc_percent     NUMERIC(6,4),        -- % carbono orgânico
  bd_g_cm3        NUMERIC(5,3),        -- densidade aparente
  argila_percent  NUMERIC(5,2),        -- % argila
  profundidade_cm INT DEFAULT 30,      -- profundidade amostrada
  -- Classificação solo
  grupo_solo_fao  TEXT,                -- WRB FAO
  textura_fao     TEXT,                -- classe textural FAO
  topografia      TEXT,                -- plano|suave_ondulado|ondulado|forte_ondulado|montanhoso|escarpado
  -- Clima (via API ou manual)
  temp_mensal     NUMERIC(5,2)[12],    -- temperatura média Jan-Dez (°C)
  precip_mensal   NUMERIC(7,2)[12],    -- precipitação Jan-Dez (mm)
  evap_mensal     NUMERIC(7,2)[12],    -- evaporação Jan-Dez (mm)
  -- Status validação
  dados_validados BOOLEAN DEFAULT false,
  validado_em     TIMESTAMPTZ,
  validado_por    UUID REFERENCES admins(id),
  criado_em       TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 `dados_manejo_anuais` (por talhão, por ano agrícola)

```sql
CREATE TABLE dados_manejo_anuais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id       UUID REFERENCES talhoes(id),
  ano_agricola    INT NOT NULL,               -- ex: 2024
  cenario         TEXT DEFAULT 'projeto',     -- 'baseline' | 'projeto'
  -- Lavoura
  cultura         TEXT,                       -- soja|milho|trigo|arroz|sorgo|algodao|cana|cafe|pasto|...
  data_plantio    DATE,
  data_colheita   DATE,
  produtividade   NUMERIC(10,4),              -- sacas/ha ou t/ha (sistema converte)
  unidade_prod    TEXT DEFAULT 'sacas_ha',    -- 'sacas_ha' | 't_ha'
  usa_irrigacao   BOOLEAN DEFAULT false,
  tipo_irrigacao  TEXT,                       -- aspersao|gotejamento|pivo|inundacao
  queima_residuos BOOLEAN DEFAULT false,
  residuo_campo   BOOLEAN DEFAULT true,       -- mantém resíduos no campo?
  -- Adubação sintética (array para múltiplos fertilizantes)
  fertilizantes_sint JSONB,  -- [{tipo, qtd_kg_ha, usa_inibidor}]
  -- Adubação orgânica
  fertilizantes_org  JSONB,  -- [{tipo, qtd_t_ha}]
  -- Calagem
  calcario        JSONB,     -- [{tipo: 'calcitico'|'dolomitico'|'gesso', qtd_t_ha}]
  -- Operações mecanizadas
  operacoes       JSONB,     -- [{operacao, combustivel, litros_ha}]
  -- Pecuária
  pecuaria        JSONB,     -- [{tipo_animal, sistema_producao, quantidade, peso_kg, meses_na_area, dieta}]
  -- Auditoria
  submetido_em    TIMESTAMPTZ,
  status          TEXT DEFAULT 'rascunho',    -- rascunho|pendente|aprovado|correcao
  aprovado_em     TIMESTAMPTZ,
  aprovado_por    UUID REFERENCES admins(id),
  versao          INT DEFAULT 1,              -- controle de versão
  criado_em       TIMESTAMPTZ DEFAULT now()
);
```

### 4.6 `resultados_motor`

```sql
CREATE TABLE resultados_motor (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talhao_id       UUID REFERENCES talhoes(id),
  ano_agricola    INT,
  -- SOC (RothC)
  soc_baseline_tc_ha   NUMERIC(12,6),
  soc_projeto_tc_ha    NUMERIC(12,6),
  delta_soc_tc_ha      NUMERIC(12,6),
  co2_soc_tco2e_ha     NUMERIC(12,6),   -- delta_SOC * (44/12)
  -- N2O (QA3)
  n2o_baseline_tco2e_ha  NUMERIC(12,6),
  n2o_projeto_tco2e_ha   NUMERIC(12,6),
  delta_n2o_tco2e_ha     NUMERIC(12,6),
  -- CH4 (QA3)
  ch4_baseline_tco2e_ha  NUMERIC(12,6),
  ch4_projeto_tco2e_ha   NUMERIC(12,6),
  delta_ch4_tco2e_ha     NUMERIC(12,6),
  -- CO2 (combustível + calagem)
  co2_ff_baseline_tco2e_ha   NUMERIC(12,6),
  co2_ff_projeto_tco2e_ha    NUMERIC(12,6),
  co2_lime_baseline_tco2e_ha NUMERIC(12,6),
  co2_lime_projeto_tco2e_ha  NUMERIC(12,6),
  -- Totais
  er_t_tco2e_ha    NUMERIC(12,6),   -- reduções de emissão
  cr_t_tco2e_ha    NUMERIC(12,6),   -- remoções de CO2
  lk_t_tco2e_ha    NUMERIC(12,6),   -- leakage
  unc_co2          NUMERIC(8,6),    -- incerteza SOC
  unc_n2o          NUMERIC(8,6),
  unc_ch4          NUMERIC(8,6),
  err_net_tco2e_ha NUMERIC(12,6),   -- créditos líquidos antes buffer
  buffer_pool_rate NUMERIC(5,4),    -- ex: 0.15
  vcus_emitidos_ha NUMERIC(12,6),   -- VCUs líquidos
  vcus_emitidos_total NUMERIC(14,4),-- * area_ha
  -- Metadados
  rodado_em       TIMESTAMPTZ DEFAULT now(),
  versao_motor    TEXT,
  parametros_usados JSONB           -- snapshot dos parâmetros usados
);
```

### 4.7 `parceiros`

```sql
CREATE TABLE parceiros (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  telefone        TEXT,
  cpf_cnpj        TEXT,
  status          TEXT DEFAULT 'ativo',
  criado_em       TIMESTAMPTZ DEFAULT now()
);
```

### 4.8 `comissoes`

```sql
CREATE TABLE comissoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id     UUID REFERENCES parceiros(id),
  lead_id         UUID REFERENCES leads(id),
  ano_pagamento   INT,              -- 0, 2, 4, 6, 8, 10
  area_elegivel_ha NUMERIC(12,4),
  ptax_dia        NUMERIC(8,4),    -- taxa BCB do dia do cálculo
  g_medio_tco2e_ha NUMERIC(10,6), -- média créditos anos anteriores (null no Ano 0)
  valor_usd       NUMERIC(14,4),
  valor_brl       NUMERIC(14,2),
  status          TEXT DEFAULT 'projetado', -- projetado|pago
  calculado_em    TIMESTAMPTZ DEFAULT now()
);
```

### 4.9 `parametros_sistema` (editáveis pelo admin)

```sql
CREATE TABLE parametros_sistema (
  chave           TEXT PRIMARY KEY,
  valor           TEXT NOT NULL,
  descricao       TEXT,
  editavel        BOOLEAN DEFAULT true,
  atualizado_em   TIMESTAMPTZ DEFAULT now(),
  atualizado_por  UUID REFERENCES admins(id)
);

-- Seed obrigatório:
INSERT INTO parametros_sistema VALUES
  ('preco_base_usd',     '20',    'Preço base do crédito em USD', true),
  ('buffer_pool_simulador', '0.15', 'Buffer pool default no simulador (15%)', true),
  ('gwp_ch4',            '28',    'GWP CH4 IPCC AR5', false),
  ('gwp_n2o',            '265',   'GWP N2O IPCC AR5', false),
  ('ef_diesel',          '0.002886', 'EF CO2 diesel (tCO2e/L)', false),
  ('ef_gasolina',        '0.002310', 'EF CO2 gasolina (tCO2e/L)', false),
  ('ef_limestone',       '0.12',  'EF calcário calcítico (tC/t)', false),
  ('ef_dolomite',        '0.13',  'EF dolomita (tC/t)', false),
  ('ef1_n2o_default',    '0.01',  'EF1 N2O solos minerais', false),
  ('ef1_n2o_inibidor',   '0.005', 'EF1 N2O com inibidor nitrificação', false),
  ('ef1_n2o_umido',      '0.016', 'EF1 N2O tropical úmido', false),
  ('ef1_n2o_seco',       '0.005', 'EF1 N2O tropical seco', false),
  ('frac_gasf',          '0.11',  'Frac_GASF fertilizante sintético', false),
  ('frac_gasf_ureia',    '0.15',  'Frac_GASF ureia', false),
  ('frac_gasm',          '0.21',  'Frac_GASM fertilizante orgânico', false),
  ('frac_leach',         '0.24',  'Frac_LEACH lixiviação', false),
  ('ef4_n2o_volat',      '0.014', 'EF4 N2O volatilização', false),
  ('ef5_n2o_leach',      '0.011', 'EF5 N2O lixiviação', false),
  ('comissao_base_usd_ha','1.00', 'Comissão base parceiro (USD/ha)', true);
```

---

## 5. Regras de Negócio e Cálculos

### 5.1 Simulador — Fórmula Principal

```
receita_anual = SUM(hectares × fator_SOC[pratica_i]) × preco_credito_BRL × (1 - buffer_pool)
receita_total = receita_anual × horizonte_anos
preco_credito_BRL = preco_base_usd × PTAX_venda_dia
```

**Regra de combinação de práticas (anti-dupla contagem):**
- Se apenas 1 prática: usa `fator_SOC[pratica]` diretamente
- Se ≥ 2 práticas: `fator_combinado = fator_max + 0.30 × SUM(demais_fatores)`
- Exemplo: prática A = 2.5, prática B = 1.8 → combinado = 2.5 + (1.8 × 0.30) = **3.04 tCO2e/ha/ano**

**Tabela de fatores SOC por prática (simulador):**

| Prática | Valor Default (tCO2e/ha/ano) | Faixa |
|---------|-------------------------------|-------|
| Plantio direto (SPD) | 2.5 | 1.5 – 3.5 |
| Planta de cobertura | 2.0 | 1.0 – 4.0 |
| Rotação de culturas | 1.2 | 0.5 – 2.0 |
| ILPF / ILP | 3.5 | 2.0 – 6.0 |
| Reforma de pastagem | 3.0 | 2.0 – 5.0 |
| Adubação orgânica | 1.5 | 0.5 – 2.5 |
| Biológicos/inoculantes | 0.8 | 0.3 – 1.5 |
| Manejo de pastagem rotacionado | 1.8 | 1.0 – 3.0 |

### 5.2 Elegibilidade Rápida (Árvore de Decisão no Simulador)

```
SE (tipo_preparo == 'plantio_direto') 
  AND (usa_cobertura == true) 
  AND (usa_org == true) 
  AND historico >= 3 anos
ENTÃO: exibir FLAG "Elegibilidade limitada — sua fazenda já pratica regenerativo"
       → continuar com estimativa + explicação de additionality
SENÃO: prosseguir normalmente sem flag
```

### 5.3 Motor RothC-26.3 (Backend Python)

O motor itera mensalmente (passo t = 1/12 ano) para cada talhão, para cada compartimento (DPM, RPM, BIO, HUM). O IOM não decompõe.

#### 5.3.1 Decomposição Mensal
```python
Y_final = Y * math.exp(-a * b * c * k * (1/12))
material_decomposto = Y * (1 - math.exp(-a * b * c * k * (1/12)))
```

#### 5.3.2 Fator de Temperatura (a)
```python
a = 47.9 / (1 + math.exp(106 / (T + 18.27)))
# T = temperatura média mensal em °C
```

#### 5.3.3 Fator de Umidade (b) via TSMD
```python
# Passo 1: Max TSMD para camada 0-23cm
max_tsmd = -(20.0 + 1.3 * pct_argila - 0.01 * pct_argila**2)

# Passo 2: Ajuste para profundidade diferente de 23cm
max_tsmd_ajust = (max_tsmd / 23) * profundidade_cm

# Passo 3: Bare Soil Moisture Deficit
bare_smd = max_tsmd / 1.8

# Passo 4: Acumulação mensal (iterar mês a mês)
if 0.75 * evap > precip:
    acc_tsmd += (precip - 0.75 * evap)
    acc_tsmd = max(acc_tsmd, max_tsmd_ajust)  # não passa do máximo
else:
    acc_tsmd = min(acc_tsmd + (precip - 0.75 * evap), 0)  # reidrata até 0

# Passo 5: Fator b
if acc_tsmd >= 0.444 * max_tsmd_ajust:
    b = 1.0
else:
    b = 0.2 + 0.8 * (max_tsmd_ajust - acc_tsmd) / (max_tsmd_ajust - 0.444 * max_tsmd_ajust)
```

#### 5.3.4 Fator de Cobertura (c)
```python
# Derivado automaticamente das datas plantio/colheita
c = 0.6  # solo vegetado (entre data_plantio e data_colheita)
c = 1.0  # solo exposto
```

#### 5.3.5 Particionamento CO2 vs BIO+HUM (por % Argila)
```python
x = 1.67 * (1.85 + 1.60 * math.exp(-0.0786 * pct_argila))
fracao_co2 = x / (x + 1)
fracao_bio_hum = 1 / (x + 1)
# Do BIO+HUM formado: 46% → BIO, 54% → HUM
```

#### 5.3.6 Razão DPM/RPM por Tipo de Input
```python
dpm_rpm = {
    'agricola': 1.44,          # culturas agrícolas / pastagem melhorada
    'pastagem_nao_melhora': 0.67,
    'floresta': 0.25,
    'fym': {'dpm': 0.49, 'rpm': 0.49, 'hum': 0.02}  # esterco/composto
}
```

#### 5.3.7 IOM (Matéria Orgânica Inerte)
```python
IOM = 0.049 * TOC**1.139  # Falloon et al. 1998
# TOC = carbono orgânico total medido (tC/ha)
```

#### 5.3.8 Input de Carbono Vegetal via Harvest Index
```python
HI = {
    'soja': 0.42, 'milho': 0.50, 'trigo': 0.40, 'arroz': 0.45,
    'sorgo': 0.35, 'algodao': 0.35, 'cana': 0.50, 'cafe': 0.30,
    'brachiaria': None, 'crotalaria': None
}
RAIZ_PA = {
    'soja': 0.20, 'milho': 0.22, 'trigo': 0.24, 'arroz': 0.20,
    'sorgo': 0.22, 'algodao': 0.20, 'cana': 0.15, 'cafe': 0.30,
    'brachiaria': 1.60, 'pastagem_brachiaria': 1.60, 'crotalaria': 0.40
}
FRACAO_C_MS = 0.45  # constante IPCC

biomassa_aerea = (yield_t_ha / HI) - yield_t_ha
biomassa_raizes = biomassa_aerea * RAIZ_PA[cultura]
input_C_total = (biomassa_aerea + biomassa_raizes) * FRACAO_C_MS  # tC/ha
```

#### 5.3.9 Estoque SOC
```python
SOC_stock_tc_ha = (SOC_percent / 100) * BD_g_cm3 * (profundidade_cm / 100) * 10000
# Conversão SOC → CO2: delta_SOC * (44/12)
CO2_tco2e_ha = delta_SOC_tc_ha * (44/12)
```

### 5.4 Módulo N2O (QA3)

#### 5.4.1 N2O Total do Solo
```
N2O_soil = N2O_fert + N2O_md + N2O_Nfix
```

#### 5.4.2 N2O por Fertilizantes — Emissão Direta
```python
# Para cada fertilizante sintético:
F_sint_kg_N_ha = qtd_kg_ha * NC_SF[tipo_fertilizante]

NC_SF = {
    'ureia': 0.46, 'map': 0.11, 'dap': 0.18,
    'sulfato_amonio': 0.21, 'kcl': 0.0, 'npk_formulado': 'informar_N%'
}

# EF1 escolhido conforme zona climática + uso de inibidor
EF1 = EF1_N2O_default  # 0.01 (padrão solo mineral)
EF1 = 0.005  # se usa_inibidor == True
EF1 = 0.016  # se zona_climatica == 'tropical_umido'
EF1 = 0.005  # se zona_climatica == 'tropical_seco'

# N2O direto fertilizantes (tCO2e/ha)
N2O_fert_direct = GWP_N2O * SUM(F_total_N * EF1) * (44/28) / 1000
```

#### 5.4.3 N2O Indireto — Volatilização e Lixiviação
```python
# Volatilização
N2O_vol = GWP_N2O * (
    SUM(F_sint * Frac_GASF) + SUM(F_org * Frac_GASM)
) * EF4 * (44/28) / 1000

Frac_GASF = 0.15  # ureia  |  0.11  # outros sintéticos
Frac_GASM = 0.21  # orgânicos
EF4 = 0.014

# Lixiviação (apenas em clima úmido ou com irrigação)
Frac_LEACH = 0.24  # úmido/irrigado  |  0.0  # seco sem irrigação
N2O_leach = GWP_N2O * SUM(F_total_N * Frac_LEACH) * EF5 * (44/28) / 1000
EF5 = 0.011
```

#### 5.4.4 N2O por Deposição de Esterco
```python
Nex = {'gado_corte': 40, 'gado_leite': 70, 'ovinos': 12, 'caprinos': 12, 'equinos': 45}
AWMS_pasto = 1.0  # deposição direta em pasto
EF_N2O_md = 0.004  # kg N2O-N / kg N

MS = meses_na_area / 12  # fração do ano que o animal permanece

F_manure = Pop * Nex * AWMS_pasto * MS
N2O_md = GWP_N2O * SUM(F_manure * EF_N2O_md) * (44/28) / 1000
```

#### 5.4.5 N2O por Fixação Biológica
```python
N_content = {'soja': 0.030, 'crotalaria': 0.025, 'feijao': 0.028}
EF_BNF = 0.01  # kg N2O-N / kg N fixado

biomassa_leguminosa = calcular_via_HI(cultura, produtividade)
F_CR = biomassa_leguminosa * N_content[cultura]
N2O_Nfix = GWP_N2O * SUM(F_CR * EF_BNF) * (44/28) / 1000
```

### 5.5 Módulo CH4 (QA3)

#### 5.5.1 CH4 Entérico
```python
EF_ent = {
    'gado_corte_extensivo': 56,      # kg CH4/cabeça/ano
    'gado_corte_semi_intensivo': 63,
    'gado_corte_confinamento': 68,
    'gado_leite': 83,
    'ovinos': 5, 'caprinos': 5, 'equinos': 18
}
CH4_ent = (GWP_CH4 * SUM(Pop * EF_ent)) / (1000 * area_ha)  # tCO2e/ha
```

#### 5.5.2 CH4 por Esterco
```python
VS_rate = {'gado_corte_am_lat': 2.9}  # kg VS/cabeça/dia
EF_CH4_md = 1.0  # kg CH4/cabeça/ano (pasto)
CH4_md = (GWP_CH4 * SUM(Pop * VS_rate * 365 * EF_CH4_md / 1000)) / (1000 * area_ha)
```

#### 5.5.3 CH4 por Queima de Biomassa
```python
CF = 0.80        # fração de combustão resíduos agrícolas (IPCC Table 2.6)
EF_CH4_bb = 2.7  # g CH4 / kg MS queimada (cereais/gramíneas)
MB = calcular_biomassa_residuos(yield, HI, area_ha)
CH4_bb = (GWP_CH4 * SUM(MB * CF * EF_CH4_bb)) / (1e6 * area_ha)
```

### 5.6 Módulo CO2 — Combustíveis e Calagem

#### 5.6.1 CO2 Combustíveis
```python
EF_CO2 = {'diesel': 0.002886, 'gasolina': 0.002310, 'etanol': 0.0}
CO2_ff = SUM(litros * EF_CO2[combustivel]) / area_ha  # tCO2e/ha
```

#### 5.6.2 CO2 Calagem
```python
EF_limestone = 0.12  # tC / t calcário calcítico
EF_dolomite  = 0.13  # tC / t dolomita
EL = (M_limestone * EF_limestone + M_dolomite * EF_dolomite) * (44/12)
CO2_lime = EL / area_ha  # tCO2e/ha
# Gesso (CaSO4): EF = 0, não gera CO2
```

### 5.7 Cálculo Final de Créditos Líquidos

```python
# Passo 1: Reduções de emissão (VM0042 Eq. 37)
ER_t = (
    delta_CO2_ff +
    delta_CO2_lime +
    delta_CH4_ent +
    delta_CH4_md +
    delta_CH4_bb +
    delta_CH4_soil * (1 - UNC_CH4) +
    delta_N2O_soil * (1 - UNC_N2O) +
    delta_N2O_bb
)
# Todos delta = valor_baseline - valor_projeto (positivo = redução)

# Passo 2: Remoções de CO2 (Eq. 40)
if delta_CO2_soil_wp > delta_CO2_soil_bsl:
    I = 1
else:
    I = -1
CR_t = (delta_CO2_soil_wp_t - delta_CO2_soil_bsl_t) * (1 - UNC_CO2 * I)

# Passo 3: Leakage (VMD0054)
LK_t = calcular_leakage(deslocamento_producao, importacao_esterco)

# Passo 4: Créditos líquidos antes buffer
ERR_net_t = ER_t + CR_t - LK_t

# Passo 5: Desconto buffer pool
VCUs_emitidos = ERR_net_t * (1 - buffer_pool_rate)
# buffer_pool_rate = 0.10 a 0.20 (definido pelo AFOLU Non-Permanence Risk Tool)
```

### 5.8 Conservadorismo na Seleção de Fatores de Emissão (VM0042 §8.6.3)

**Regra obrigatória:** O sistema deve implementar automaticamente:
- Quando emissões **diminuem** (projeto < baseline): usar o EF que resulte na **MENOR redução** (limite inferior da faixa IPCC)
- Quando emissões **aumentam** (projeto > baseline): usar o EF que resulte na **MAIOR emissão** (limite superior da faixa)

### 5.9 Cálculo de Comissões (Parceiro)

```python
# Ano 0 (contratação)
comissao_ano_0 = area_elegivel_ha * 1.00 * PTAX_venda_dia  # R$

# Anos 2, 4, 6, 8, 10 (após verificação de créditos)
G_medio = media(vcus_emitidos_ha, anos_anteriores)  # tCO2e/ha/ano
Pm = (G_medio / 2) * 1.00 * area_elegivel_ha * PTAX_venda_dia  # R$
```

### 5.10 Regras de Control Sites (VM0042 §8.2)

| Parâmetro | Exigência | Ação da Plataforma |
|-----------|-----------|-------------------|
| Mínimo absoluto | ≥ 3 control sites por projeto | Alerta + bloqueio de verificação |
| Mínimo por estrato | ≥ 1 control site por estrato | Alerta de validação |
| Recomendado | ≥ 10 control sites | Alerta amarelo se < 10 |
| Distância | ≤ 250 km das QUs | Cálculo automático entre KMLs |
| Topografia | Mesma classe de declive | Campo de seleção + validação |
| Textura do solo | Mesma classe FAO | Campo do laudo |
| Histórico de manejo | Mesmas práticas 5 anos | Formulário específico |

---

## 6. Perfis de Usuário e Permissões

### 6.1 Tabela de Permissões

| Ação | Lead (anon) | Produtor | Parceiro | Admin |
|------|:-----------:|:--------:|:--------:|:-----:|
| Acessar simulador | ✅ | ✅ | ✅ | ✅ |
| Ver próprio dashboard MRV | ❌ | ✅ | ❌ | ✅ |
| Inserir dados de manejo | ❌ | ✅ | ❌ | ✅ |
| Submeter dados para validação | ❌ | ✅ | ❌ | ✅ |
| Cadastrar leads | ❌ | ❌ | ✅ | ✅ |
| Ver painel parceiro | ❌ | ❌ | ✅ | ✅ |
| Validar/aprovar dados | ❌ | ❌ | ❌ | ✅ |
| Cadastrar talhões e solo | ❌ | ❌ | ❌ | ✅ |
| Cadastrar control sites | ❌ | ❌ | ❌ | ✅ |
| Editar parâmetros do sistema | ❌ | ❌ | ❌ | ✅ |
| Rodar motor de cálculos | ❌ | ❌ | ❌ | ✅ |
| Ver todos os projetos | ❌ | ❌ | ❌ | ✅ |

---

## 7. Jornada 1 — Simulador de Leads

**URL:** `/simulacao` · Pública, sem login

### 7.1 Tela 1 — Gate de Cadastro

**Objetivo:** Capturar o lead antes de exibir qualquer resultado.

**Campos obrigatórios:**
- Nome completo
- Telefone (com máscara brasileira)
- E-mail

**UX:** Card centralizado, fundo `--color-background`, logo Venture Carbon no topo. Botão primário "Começar Simulação".

**Validações:**
- E-mail: formato válido
- Telefone: mínimo 10 dígitos (com ou sem DDD formatado)
- Todos obrigatórios — sem avançar com campos vazios

**Backend:** Ao submit, cria registro em `leads` com `status = 'novo'`. Retorna token de sessão temporária para controlar o fluxo das próximas telas (sem login).

---

### 7.2 Tela 2 — Área da Propriedade

**Objetivo:** Coletar a área em hectares.

**Duas opções:**
1. **Upload KML:** Drag-and-drop ou seleção de arquivo. O sistema processa o KML, renderiza o perímetro no mapa (Leaflet, camada verde `--map-project`), e exibe a área calculada em hectares (via turf.js ou PostGIS).
2. **Entrada manual:** Campo numérico "Área total (ha)" com input limpo.

**Componentes:**
- Mapa responsivo com altura mínima 340px
- Card sobreposto no mapa exibindo área calculada: `"Área: 1.234,5 ha"`
- Botão "Usar área calculada" se KML processado; ou campo manual se preferir

**Validação:** Área deve ser > 0 e < 1.000.000 ha (limite razoável).

---

### 7.3 Tela 3 — Cultura e Manejo Atual

**Objetivo:** Coletar o histórico dos últimos 3 anos para árvore de elegibilidade.

**Campos:**
- **Culturas** (seleção múltipla com chips): Soja, Milho, Algodão, Cana, Café, Pasto, Trigo, Arroz, Sorgo, Outras
- **Tipo de preparo do solo** (rádio): Convencional | Reduzido | Plantio Direto
- **Usa plantas de cobertura?** (toggle Sim/Não)
- **Usa adubação orgânica?** (toggle Sim/Não)
- **Tem pecuária integrada?** (toggle Sim/Não)

**Lógica backend (árvore de elegibilidade):**
```
SE plantio_direto + usa_cobertura + usa_org → mostrar aviso de elegibilidade limitada na Tela 4
SENÃO → prosseguir normalmente
```

---

### 7.4 Tela 4 — Práticas Desejadas (Cálculo em Tempo Real)

**Objetivo:** Selecionar práticas regenerativas e ver estimativa atualizada em tempo real.

**Layout:**
- Coluna esquerda: lista de 8-15 práticas com checkboxes
- Coluna direita: card fixo de resultado que atualiza a cada checkbox marcado
- Seletor de horizonte (10 ou 20 anos) no topo da coluna direita

**Práticas listadas (com descrição curta e fator SOC como tooltip):**
1. Plantio Direto (SPD) — 2.5 tCO2e/ha/ano
2. Plantas de Cobertura — 2.0 tCO2e/ha/ano
3. Rotação de Culturas — 1.2 tCO2e/ha/ano
4. Integração Lavoura-Pecuária-Floresta (ILPF) — 3.5 tCO2e/ha/ano
5. Reforma de Pastagem Degradada — 3.0 tCO2e/ha/ano
6. Adubação Orgânica — 1.5 tCO2e/ha/ano
7. Biológicos e Inoculantes — 0.8 tCO2e/ha/ano
8. Manejo Rotacionado de Pastagem — 1.8 tCO2e/ha/ano

**Cálculo frontend (JavaScript, executado a cada mudança):**
```javascript
function calcularReceita(praticas, hectares, ptax, horizonte) {
  if (praticas.length === 0) return { receita: 0, tco2e: 0 };

  const fatores = praticas.map(p => FATORES_SOC[p]);
  const fatorMax = Math.max(...fatores);
  const demais = fatores.filter(f => f !== fatorMax);
  const fatorCombinado = demais.length > 0
    ? fatorMax + demais.reduce((a,b) => a+b, 0) * 0.30
    : fatorMax;

  const preco_brl = 20 * ptax;
  const buffer_pool = 0.15;
  const tco2e_ano = hectares * fatorCombinado;
  const receita_anual = tco2e_ano * preco_brl * (1 - buffer_pool);
  const receita_total = receita_anual * horizonte;
  return { receita_total, receita_anual, tco2e_ano, fatorCombinado };
}
```

**Card de resultado (lado direito, atualiza em tempo real):**
```
┌─────────────────────────────────┐
│  💰 Estimativa de Receita       │
│                                 │
│  R$ 2.847.000                   │ ← receita_total
│  em 10 anos                     │
│                                 │
│  R$ 284.700 / ano               │ ← receita_anual
│  R$ 284,70 / ha / ano           │ ← receita_anual / hectares
│                                 │
│  123 tCO2e estimadas / ano      │ ← tco2e_ano
│                                 │
│  Custo para você: R$ 0          │ ← texto fixo
│  Venture arca com todos os      │
│  custos do programa.            │
└─────────────────────────────────┘
```

**PTAX:** Buscar da API BCB ao carregar a tela, com cache de 1 hora. Se API indisponível, usar último valor + badge "Câmbio estimado".

---

### 7.5 Tela 5 — Resultado

**Objetivo:** Apresentar o resultado completo e converter o lead.

**Componentes visuais:**
- **Número destaque:** receita_total em R$ (H1 enorme, cor primary)
- **Gráfico de barras** (Chart.js): receita projetada por ano, cor `--color-primary`
- **Comparativo:** tabela visual "Manejo Convencional vs Regenerativo" (custo típico convencional vs R$ 0 para o produtor no Venture)
- **Métricas secundárias** em cards menores: tCO2e/ano, R$/ha/ano
- **Botão primário:** "Falar com Consultor" → abre WhatsApp com mensagem pré-formatada
- **Botão secundário:** "Criar Conta Completa" → redireciona para `/cadastro`

**Persistência:** Dados do simulador são salvos no `leads` para análise posterior pelo admin.

---

## 8. Jornada 2 — MRV Digital (Cliente)

**URL:** `/dashboard` · Requer login

### 8.1 Dashboard Principal (Home)

**Componentes:**
- **Barra de progresso geral** (0–100%): percentual de completude das 6 categorias de dados
- **Mapa da fazenda** (Leaflet, tela cheia ou 50% da viewport): talhões de projeto em verde, control sites em azul, excluídos em cinza. Clicável — ao clicar num talhão, abre o painel de dados daquele talhão.
- **Card de projeção financeira** (estimativa atualizada a cada novo dado aprovado)
- **Painel de alertas/pendências:** lista de itens que precisam atenção (ex: "Solo do Talhão A2 sem laudo", "3 anos de dados de manejo faltando")
- **Status geral do projeto:** badge (Em configuração | Em monitoramento | Em verificação | Créditos emitidos)

### 8.2 Seção: Dados de Lavoura (por talhão)

**Fluxo por talhão, por ano agrícola.** O produtor seleciona o talhão no mapa ou na lista lateral e preenche os dados do ano.

**Campos do formulário (Dados de Lavoura):**

| Campo | Tipo | Observação |
|-------|------|-----------|
| Cultura plantada | Seleção | Lista pré-definida |
| Data de plantio | Date picker | dd/mm do ano agrícola |
| Data de colheita | Date picker | dd/mm |
| Produtividade | Numérico + unidade (sacas/ha ou t/ha) | Sistema converte internamente |
| Mantém resíduos no campo? | Toggle Sim/Não | Se Não → queima ou exportação |
| Queima resíduos? | Toggle (aparece se Não acima) | Sim/Não |
| Utiliza irrigação? | Toggle Sim/Não | Se Sim → tipo |
| Tipo de irrigação | Seleção (aspersão / gotejamento / pivô / inundação) | Só se irrigação = Sim |

**Cálculos automáticos exibidos ao produtor (informativo):**
- Input C vegetal estimado (tC/ha) calculado via Harvest Index
- Meses de cobertura do solo (vegetado vs exposto)

### 8.3 Seção: Dados de Pecuária

**Aparece somente se o produtor tem pecuária (seleção no onboarding).**

| Campo | Tipo | Observação |
|-------|------|-----------|
| Tipo de animal | Seleção | Gado corte / Gado leite / Ovinos / Caprinos / Equinos |
| Sistema de produção | Seleção | Extensivo / Semi-intensivo / Confinamento |
| Número de cabeças | Numérico | |
| Peso médio por cabeça | Numérico (kg) | Default IPCC se não souber |
| Meses/ano na área | Numérico (1-12) | Para calcular MS = meses/12 |
| Dieta/suplementação | Seleção | Afeta Ym (fator de conversão CH4) |

**Permite múltiplos tipos de animal** (ex: gado corte + ovinos na mesma área).

### 8.4 Seção: Dados de Fertilização

| Campo | Tipo | Observação |
|-------|------|-----------|
| Tipo de fertilizante sintético | Seleção (com busca) | Ureia, MAP, DAP, Sulfato amônio, KCl, NPK formulado |
| Quantidade aplicada | Numérico (kg/ha) | Sistema converte para toneladas |
| Usa inibidor de nitrificação? | Toggle Sim/Não | Reduz EF1 de 0.01 para 0.005 |
| Tipo de fertilizante orgânico | Seleção | Esterco bovino, cama de frango, composto, vinhaça |
| Quantidade orgânico | Numérico (t/ha) | |
| Tipo de corretivo de solo | Seleção | Calcário calcítico / Dolomítico / Gesso |
| Quantidade de corretivo | Numérico (t/ha) | Gesso = 0 emissão CO2 |

**Permite múltiplos fertilizantes** (adicionar linha por tipo).

### 8.5 Seção: Dados Operacionais

| Campo | Tipo | Observação |
|-------|------|-----------|
| Operação mecanizada | Seleção múltipla | Aragem, gradagem, plantio, pulverização, colheita, transporte |
| Combustível por operação | Seleção | Diesel / Gasolina / Etanol |
| Litros consumidos | Numérico | Se não souber: informar horas-máquina + tipo de máquina |

**Nota de suporte UX:** Se o produtor informar horas-máquina, o sistema usa consumo médio por tipo de máquina para estimar litros.

### 8.6 Seção: Documentos e Fotos

- Upload de laudos laboratoriais (PDF)
- Upload de fotos georreferenciadas (GPS embarcado do celular)
- Upload de KML atualizado
- Qualquer documento exigido pelo VVB

### 8.7 Fluxo de Aprovação (Status por Dado)

```
Rascunho (produtor editando)
  ↓ [Botão: Submeter para Validação]
Pendente validação (admin analisa)
  ↓ Admin aprova                    ↓ Admin solicita correção
Aprovado (dado trava)              Correção solicitada
  → Versão imutável com timestamp   → Produtor recebe notificação
  → Motor pode ser executado        → Produtor resubmete
```

**Regra de travamento:** Uma vez aprovado, o dado não pode ser editado. Novas entradas criam nova versão (`versao += 1`). O motor sempre usa a versão aprovada mais recente.

---

## 9. Jornada 3 — Painel do Parceiro

**URL:** `/parceiro` · Requer login com perfil `parceiro`

### 9.1 Dashboard do Parceiro

**Cards de resumo (topo):**
- Total de leads indicados
- Total de hectares indicados
- Leads contratados (%)
- Comissão projetada total (R$)
- Comissão recebida até hoje (R$)

**Ranking anônimo:** Posição relativa do parceiro no programa, sem exibir nomes dos outros parceiros. Ex: "Você está entre os top 20% de parceiros ativos."

**Próximos marcos:** Ex: "Ao atingir 500 ha contratados, você sobe para o nível Gold."

### 9.2 Formulário de Cadastro de Lead

**Campos obrigatórios:**
- Nome do produtor
- Telefone
- E-mail
- Nome da fazenda
- Município + Estado (com busca por IBGE)
- Área estimada (ha)
- Cultura principal
- Tipo de manejo atual (convencional / parcialmente regenerativo / regenerativo)

**Campo opcional:**
- Upload KML da propriedade

**Botão:** "Enviar Indicação" → cria `lead` com `parceiro_id` vinculado.

### 9.3 Status dos Leads (Lista)

Tabela com:

| Produtor | Fazenda | Área (ha) | Status | Comissão projetada | Data indicação |
|----------|---------|-----------|--------|-------------------|---------------|

**Badges de status:** Em análise (warning) · Aprovado (primary) · Contratado (success) · Em monitoramento (primary) · Recusado (danger com motivo em tooltip)

### 9.4 Detalhes de Comissão por Lead

Para cada lead contratado, exibir:

| Período | Base de Cálculo | Valor USD | Valor R$ | Status |
|---------|----------------|-----------|----------|--------|
| Ano 0 | 1.000 ha × $1/ha | $1.000 | R$ 5.650 | Pago |
| Ano 2 | (G_medio/2) × 1.000 ha × $1/ha | $780 | — | Projetado |
| ... | ... | ... | ... | ... |

---

## 10. Jornada 4 — Painel Admin (Venture Carbon)

**URL:** `/admin` · Requer login com perfil `admin`

### 10.1 Dashboard Admin

**Visão geral de negócio:**
- Leads no funil: Novos / Em análise / Contratados / Recusados
- Projetos ativos em monitoramento
- Total de VCUs emitidos (histórico)
- Total de VCUs em pipeline (projeção)
- Alerta: projetos com dados pendentes de validação

### 10.2 Gestão de Leads e Projetos

**Listagem de leads:** Filtros por status, parceiro, estado, cultura, área. Ação por lead: Aprovar / Recusar (com motivo) / Vincular a produtor existente.

**Gestão de fazendas e talhões:**
- Criar/editar fazendas
- Criar/editar talhões com upload KML (renderizado no mapa)
- Classificar talhão como: projeto | control_site | excluído
- Inserir dados de solo (após laudo laboratorial): SOC%, BD, argila%, profundidade
- Inserir dados climáticos (temperatura, precipitação, evaporação mensais): via API automática ou entrada manual

### 10.3 Validação de Dados do Produtor

**Fila de validação:** Lista de envios com status "Pendente". Admin clica e vê formulário preenchido pelo produtor. Pode:
- **Aprovar:** dado é travado com timestamp e usuário admin
- **Solicitar correção:** campo de comentário que vai para o produtor por notificação

### 10.4 Control Sites

**Cadastro de control sites (mesma estrutura do talhão de projeto):**
- KML do control site
- Vínculo com fazenda/talhão de projeto (relação N:N)
- Dados de solo e manejo histórico
- Critérios de similaridade preenchidos (topografia, textura, zona climática, distância)

**Painel de conformidade:** Lista de projetos com:
- Número atual de control sites
- Alerta vermelho se < 3 · Alerta amarelo se < 10 · Verde se ≥ 10

### 10.5 Motor de Cálculos

**Interface para disparar cálculos:**
- Seleção de fazenda/talhão e ano agrícola
- Seleção de cenário: Baseline | Projeto | Ambos (delta)
- Botão "Executar Motor" → enfileira job background

**Histórico de execuções:** Log de cada run com parâmetros usados, resultado e timestamp.

**Parâmetros do motor (editáveis pelo admin):**
- Lista completa da tabela `parametros_sistema`
- Campos protegidos (constantes metodológicas) em modo somente-leitura com label "Constante metodológica"
- Campos editáveis: preço base USD, buffer pool, comissão base

### 10.6 Configurações Globais

- PTAX: visualizar valor atual e histórico
- Tabela de fatores SOC (simulador): editar valores default da tabela de práticas
- Fatores de emissão customizados: admin pode sobrescrever qualquer EF default por um fator projeto-específico de fonte peer-reviewed, com campo "Fonte/Justificativa"
- Gestão de usuários e perfis (parceiros, produtores)

---

## 11. Motor de Cálculos Backend

### 11.1 Serviço Python (FastAPI)

**Endpoints expostos:**

```
POST /calcular/simulador
  body: { hectares, praticas[], horizonte, ptax }
  → { receita_total, receita_anual, tco2e_ano, fator_combinado }

POST /calcular/rothc
  body: { talhao_id, ano_inicio, ano_fim, cenario: 'baseline'|'projeto' }
  → { soc_por_mes[], delta_soc, co2_tco2e_ha }

POST /calcular/qa3
  body: { talhao_id, ano_agricola, cenario }
  → { n2o_total, ch4_total, co2_ff, co2_lime }

POST /calcular/creditos
  body: { talhao_id, ano_agricola }
  → { er_t, cr_t, lk_t, err_net, vcus_emitidos }
```

### 11.2 Fluxo de Execução do Motor Completo

```
1. Carregar dados validados e travados do PostgreSQL
2. Para BASELINE:
   a. Definir práticas pré-projeto (dados ALM históricos)
   b. Rodar RothC mensalmente por N anos de baseline
   c. Calcular QA3 (N2O, CH4, CO2) com práticas baseline
3. Para PROJETO:
   a. Definir práticas regenerativas do ano monitorado
   b. Rodar RothC mensalmente
   c. Calcular QA3 com práticas projeto
4. Calcular deltas (projeto - baseline) para cada fonte
5. Aplicar conservadorismo nos EFs
6. Calcular UNC (incerteza) via VMD0053
7. Calcular ER_t, CR_t, LK_t
8. Calcular ERR_net_t = ER_t + CR_t - LK_t
9. Aplicar buffer pool
10. Persistir resultados em `resultados_motor`
11. Notificar admin e produtor via webhook/email
```

### 11.3 Periodicidade de Monitoring

| Parâmetro | Frequência | Obrigação |
|-----------|-----------|-----------|
| Dados de manejo (ALM) | Anual | Attestation do produtor + evidência |
| Medição SOC | A cada 5 anos (mínimo) | Obrigatória QA1 e QA2 |
| Dados climáticos | Mensal | Contínuo via API |
| Verificação de créditos | 1-5 anos | Por VVB credenciada |
| Baseline reassessment | A cada 10 anos | Recomendado a cada 5 |
| Fatores de emissão | A cada 5 anos | Atualizar se melhor EF disponível |

---

## 12. Integrações Externas

### 12.1 BCB — API PTAX (Taxa de Câmbio)

```
URL: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='MM-DD-YYYY'&$format=json
```

- Buscar diariamente às 13h (após fechamento PTAX)
- Armazenar em Redis com TTL de 24h
- Fallback: usar último valor disponível + badge "Câmbio estimado"
- Campo usado: `cotacaoVenda`

### 12.2 INMET / Weather API (Dados Climáticos)

- Fonte primária: estação meteorológica mais próxima (≤ 50km da fazenda)
- Dados: temperatura média mensal, precipitação mensal, evaporação mensal
- Fallback: inserção manual pelo admin
- Armazenar 12 valores mensais por talhão no campo `talhoes.temp_mensal`, `talhoes.precip_mensal`, `talhoes.evap_mensal`
- Atualização: mensal (dados alimentam RothC continuamente)

### 12.3 MapBiomas (Fase Futura — Não MVP)

- Cobertura histórica do solo (50 anos)
- Verificação de uso da terra para critérios de similaridade
- Integração direta adiada para fases subsequentes

### 12.4 QGIS / Processamento Geoespacial (Fase Futura)

- Automatização de análise de KML
- Digital Soil Mapping (VT0014)
- Adiado para fases subsequentes

---

## 13. Fases de Implementação (MVP Roadmap)

### Fase 0 — Fundação (Semanas 1-2)

- [ ] Setup repositório + CI/CD
- [ ] Design system: tokens CSS, componentes base (Button, Input, Card, Badge, Progress)
- [ ] Autenticação (NextAuth): roles produtor, parceiro, admin
- [ ] Banco de dados: migrations PostgreSQL (todas as tabelas da Seção 4)
- [ ] Seed: `parametros_sistema` com todos os valores default
- [ ] Integração BCB PTAX com cache Redis

### Fase 1 — Simulador de Leads (Semanas 3-4)

- [ ] Tela 1: Gate de cadastro (coleta lead)
- [ ] Tela 2: Upload KML + mapa Leaflet + cálculo de área
- [ ] Tela 3: Cultura e manejo atual + árvore de elegibilidade
- [ ] Tela 4: Práticas desejadas + cálculo em tempo real no frontend
- [ ] Tela 5: Resultado com gráfico (Chart.js) + CTAs
- [ ] Persistência do lead no banco
- [ ] Regra de combinação de práticas (fator_max + 30% demais)

### Fase 2 — Painel Admin (Semanas 5-6)

- [ ] Dashboard admin com funil de leads
- [ ] Gestão de fazendas e talhões (CRUD + KML)
- [ ] Upload e visualização de KML no mapa (talhões verde/azul/cinza)
- [ ] Inserção de dados de solo (por talhão)
- [ ] Inserção de dados climáticos (manual + integração INMET básica)
- [ ] Gestão de control sites
- [ ] Painel de conformidade de control sites

### Fase 3 — Dashboard do Produtor (Semanas 7-9)

- [ ] Dashboard home com mapa clicável, barra de progresso, alertas
- [ ] Formulário: Dados de Lavoura (por talhão, por ano)
- [ ] Formulário: Dados de Pecuária
- [ ] Formulário: Dados de Fertilização
- [ ] Formulário: Dados Operacionais
- [ ] Upload de documentos e fotos
- [ ] Fluxo de submissão e validação (rascunho → pendente → aprovado/correção)
- [ ] Travamento de dados aprovados (versionamento)

### Fase 4 — Motor de Cálculos (Semanas 10-13)

- [ ] Serviço Python FastAPI isolado
- [ ] Módulo RothC-26.3 completo (decomposição mensal, 5 compartimentos)
- [ ] Módulo N2O (fertilizantes direto + indireto, esterco, fixação biológica)
- [ ] Módulo CH4 (entérico, esterco, queima)
- [ ] Módulo CO2 (combustíveis, calagem)
- [ ] Cálculo de créditos líquidos (ER + CR - LK - buffer)
- [ ] Aplicação de conservadorismo nos EFs
- [ ] Persistência de resultados em `resultados_motor`
- [ ] Background jobs com BullMQ
- [ ] Interface admin para disparar cálculos e ver histórico

### Fase 5 — Painel do Parceiro (Semana 14)

- [ ] Dashboard parceiro (resumo + ranking anônimo)
- [ ] Formulário de cadastro de lead pelo parceiro
- [ ] Lista de leads com status
- [ ] Cálculo e exibição de comissões (Ano 0 + Anos 2,4,6,8,10)

### Fase 6 — Polimento e Hardening (Semanas 15-16)

- [ ] Notificações (e-mail) para mudanças de status
- [ ] Rate limiting e segurança no simulador público
- [ ] Testes end-to-end (Playwright) para fluxos críticos
- [ ] Testes unitários do motor de cálculos (comparar output com valores manuais)
- [ ] Auditoria log completa de ações admin
- [ ] Performance: otimizar queries geoespaciais (índices PostGIS)
- [ ] Documentação de API interna

---

## Apêndice A — Lookup Tables (Seeds)

### Fertilizantes Sintéticos e Teor N (NC_SF)

```json
[
  { "tipo": "ureia", "nc": 0.46, "frac_gasf": 0.15 },
  { "tipo": "map", "nc": 0.11, "frac_gasf": 0.11 },
  { "tipo": "dap", "nc": 0.18, "frac_gasf": 0.11 },
  { "tipo": "sulfato_amonio", "nc": 0.21, "frac_gasf": 0.11 },
  { "tipo": "kcl", "nc": 0.00, "frac_gasf": 0.00 },
  { "tipo": "nitrato_calcio", "nc": 0.155, "frac_gasf": 0.11 }
]
```

### Fertilizantes Orgânicos e Teor N (NC_OF)

```json
[
  { "tipo": "esterco_bovino", "nc": 0.015 },
  { "tipo": "cama_frango", "nc": 0.030 },
  { "tipo": "composto", "nc": 0.020 },
  { "tipo": "vinhaca", "nc": 0.003 }
]
```

### Animais e Parâmetros (IPCC)

```json
[
  { "tipo": "gado_corte_extensivo", "ef_ent": 56, "nex": 40, "vs_rate": 2.9 },
  { "tipo": "gado_corte_semi", "ef_ent": 63, "nex": 40, "vs_rate": 2.9 },
  { "tipo": "gado_corte_conf", "ef_ent": 68, "nex": 40, "vs_rate": 2.9 },
  { "tipo": "gado_leite", "ef_ent": 83, "nex": 70, "vs_rate": 3.5 },
  { "tipo": "ovinos", "ef_ent": 5, "nex": 12, "vs_rate": 0.5 },
  { "tipo": "caprinos", "ef_ent": 5, "nex": 12, "vs_rate": 0.4 },
  { "tipo": "equinos", "ef_ent": 18, "nex": 45, "vs_rate": 3.5 }
]
```

### Harvest Index e Razão Raiz:Parte Aérea

```json
[
  { "cultura": "soja", "hi": 0.42, "raiz_pa": 0.20, "n_content": 0.030 },
  { "cultura": "milho", "hi": 0.50, "raiz_pa": 0.22, "n_content": null },
  { "cultura": "trigo", "hi": 0.40, "raiz_pa": 0.24, "n_content": null },
  { "cultura": "arroz", "hi": 0.45, "raiz_pa": 0.20, "n_content": null },
  { "cultura": "sorgo", "hi": 0.35, "raiz_pa": 0.22, "n_content": null },
  { "cultura": "algodao", "hi": 0.35, "raiz_pa": 0.20, "n_content": null },
  { "cultura": "cana", "hi": 0.50, "raiz_pa": 0.15, "n_content": null },
  { "cultura": "cafe", "hi": 0.30, "raiz_pa": 0.30, "n_content": null },
  { "cultura": "brachiaria", "hi": null, "raiz_pa": 1.60, "n_content": null },
  { "cultura": "crotalaria", "hi": null, "raiz_pa": 0.40, "n_content": 0.025 },
  { "cultura": "pastagem_brachiaria", "hi": null, "raiz_pa": 1.60, "n_content": null }
]
```

---

## Apêndice B — Notas Metodológicas Obrigatórias

1. **Hierarquia de EFs (VM0042 §8.6.3):** Preferência em ordem: (1) fator projeto-específico peer-reviewed → (2) Tier 2 fonte alternativa robusta → (3) Tier 2 derivado dos dados do projeto → (4) Tier 1 IPCC 2019 (default mínimo). Admin deve poder sobrescrever qualquer EF com registro de fonte e justificativa.

2. **Período de baseline:** Fixado ex ante, repetido ao longo do primeiro período. Reavaliação obrigatória a cada 10 anos, recomendada a cada 5. A plataforma deve suportar múltiplos períodos de baseline por projeto.

3. **Incerteza (VMD0053):** `UNC = (√s² / delta_medio) × 100 × t_0.667`, onde t_0.667 ≈ 0.4307 (66.7% confiança). Calculada automaticamente pelo motor.

4. **VCUs emitidos:** Fração do ERR_net retida como buffer definida pelo AFOLU Non-Permanence Risk Tool (tipicamente 10-20%). O restante são os VCUs emitidos.

5. **Fases futuras (fora do MVP):** Integração direta MapBiomas, app mobile nativo, WhatsApp API, automação QGIS, Digital Soil Mapping (VT0014).

---

*Documento gerado a partir do cruzamento do Manual Técnico Completo v2.0 e do documento de Fluxos e Wireframes — Venture Carbon, Março 2026.*
