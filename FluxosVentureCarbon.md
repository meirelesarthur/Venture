# Venture Carbon — Mapa de Fluxos
> Versão 1.0 · Abril 2026

---

## 🟢 Fluxo 1 — Simulador (Lead / Público)

```
/acesso público
    │
    ▼
┌─────────────────────────────────────────────────┐
│  /simulacao  —  Wizard 7 Steps                  │
│                                                  │
│  Step 0  → Boas-vindas                           │
│  Step 1  → Localização (município + UF)          │
│  Step 2  → Área (KML upload ou manual)           │
│  Step 3  → Cultura + Manejo últimos 3 anos       │
│  Step 4  → Práticas desejadas (8 checkboxes)     │
│            + Horizonte (10 ou 20 anos)            │
│            ⚡ Recálculo tempo real a cada seleção │
│  Step 5  → Lead capture (nome, email, tel)       │
│  Step 6  → Resultado: receita R$, tCO₂e, gráfico │
│            CTAs: [Falar Consultor] [Criar Conta]  │
└─────────────────────────────────────────────────┘
    │
    ▼
 Lead cadastrado no Zustand (status: "novo")
    │
    ├──→ Parceiro acompanha no /parceiro/leads
    └──→ Admin gerencia em /admin/leads
```

**Motor:** Fórmulas do simulador (DevGuide §18) — `fator_combinado = maior + 0.3 × soma_demais`

---

## 🔵 Fluxo 2 — MRV Digital (Cliente / Produtor)

```
Produtor logado → /dashboard
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  /dashboard/mrv/*  —  Tabs de Coleta de Dados       │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐     │
│  │  Mapa    │  │ Lavoura  │  │  Fertilização │     │
│  │ KML+Mapa │  │ Cultura  │  │  Sint/Org/Cal │     │
│  └──────────┘  │ Datas    │  └───────────────┘     │
│                │ Produt.  │                          │
│  ┌──────────┐  └──────────┘  ┌───────────────┐     │
│  │Pecuária  │                │  Operacional  │     │
│  │Animais   │  ┌──────────┐  │  Diesel/Op    │     │
│  │Sistema   │  │Documentos│  └───────────────┘     │
│  └──────────┘  │ Uploads  │                         │
│                └──────────┘                          │
└─────────────────────────────────────────────────────┘
    │
    ▼
 Produtor submete → status: "rascunho" → "pendente"
    │
    ▼
┌──────────────────────────────┐
│  Admin revisa em             │
│  /admin/validacao            │
│                              │
│  [Aprovar]                   │  → status: aprovado
│  Dado travado (timestamp     │    → Dado imutável
│   + adminId)                 │
│                              │
│  [Corrigir]                  │  → status: correcao
│  Notifica produtor           │    → Produtor resubmete
└──────────────────────────────┘
    │
    ▼
 Motor pode ser disparado (Admin → /admin/motor)
    │
    ▼
 Resultados visíveis em /dashboard/resultados (VCUs)
```

### Dados Coletados

| Tab | Dados | Responsável |
|-----|-------|-------------|
| Mapa | KML da propriedade, demarcação | Produtor |
| Lavoura | Cultura, datas, produtividade, irrigação, queima | Produtor |
| Pecuária | Tipo animal, sistema, quantidade, peso | Produtor |
| Fertilização | Sintéticos, orgânicos, calcário, inibidores | Produtor |
| Operacional | Diesel por operação mecanizada | Produtor |
| Solo | SOC%, BD, argila%, profundidade | **Admin** |
| Climáticos | Temp/precip/evap mensais | **Admin / API** |

---

## 🟡 Fluxo 3 — Painel do Parceiro

```
Parceiro logado → /parceiro
    │
    ▼
┌──────────────────────────────────────┐
│  Dashboard                           │
│  • KPIs (pago, projetado, ha, leads) │
│  • Ranking (Bronze→Platina)          │
│  • Leads recentes + status           │
│  • Gráfico comissão paga vs projetada│
└──────────────────────────────────────┘
    │
    ├──→ /parceiro/leads/novo
    │         │
    │         ▼
    │    Form: nome, tel, email, fazenda, município,
    │           área, cultura, manejo, KML (opcional)
    │         │
    │         ▼
    │    Lead criado (status: "novo")
    │
    ├──→ /parceiro/leads
    │         │
    │         ▼
    │    Pipeline:
    │    novo → em_analise → aprovado → contratado → efetivado
    │                                ↘ recusado
    │
    ├──→ /parceiro/comissoes
    │         │
    │         ▼
    │    Ano 0: US$1.00/ha × área × PTAX
    │    Anos 2,4,6,8,10: (Gmédio/2) × US$1.00/ha × PTAX
    │
    └──→ /parceiro/ranking
              │
              ▼
         <500ha → Bronze
         500–2.000ha → Prata
         2.000–5.000ha → Ouro
         >5.000ha → Platina
```

---

## 🔴 Fluxo 4 — Admin Venture Carbon

```
Admin logado → /admin
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Dashboard — KPIs Globais + Mapa Brasil (22 fazendas) │
│  • Fila leads (novo/em_analise)                       │
│  • Fila validação MRV (pendente/correcao)             │
└──────────────────────────────────────────────────────┘
    │
    ├──→ /admin/clientes              Lista produtores
    ├──→ /admin/clientes/:id          Ficha + validação MRV
    │
    ├──→ /admin/leads                 Fila de prospecções
    ├──→ /admin/parceiros             Gestão de parceiros
    │
    ├──→ /admin/fazendas              Grid/tabela + filtros + paginação
    ├──→ /admin/fazendas/:id          Fazenda completa (talhões + MRV)
    │
    ├──→ /admin/validacao             Fila validação MRV
    │         │                       [Aprovar] / [Corrigir]
    │
    ├──→ /admin/control-sites         3 abas:
    │    │   • Dashboard: KPIs + alertas (CS<3 bloqueante)
    │    │   • Lista: tabela CS + melhor score matching
    │    │   • Matching: CS ↔ Fazenda → 9 critérios VM0042
    │    │
    │    ├──→ /admin/control-sites/novo     Cadastrar CS
    │    └──→ /admin/control-sites/:id      Detalhe CS
    │
    ├──→ /admin/motor/:fazendaId?     Runner do motor
    │         │
    │         ▼
    │    Seleciona fazenda + talhão + ano
    │    [Executar Motor] → Progress bar
    │    Resultados: RothC, N₂O, CH₄, CO₂, VCUs
    │
    ├──→ /admin/parametros            47 parâmetros editáveis
    │         • Preço crédito, PTAX, buffer pool
    │         • EFs (com fonte+justificativa)
    │         • GWP (read-only)
    │
    └──→ /admin/usuarios              Gestão de usuários e permissões
```

---

## ⚙️ Motor de Cálculos

```
rodarMotorCompleto(talhao, manejoProj, manejoBase, clima, parametros)
    │
    ▼
┌───────────────────────────────────────────────────────────┐
│  1. RothC Baseline   → SOC baseline (5 compartimentos)    │
│  2. RothC Projeto    → SOC projeto (DPM, RPM, BIO, HUM,  │
│                        IOM → mensal × 3 anos)             │
│  3. N₂O Baseline     → Eq.16-31 (fert + esterco + BNF)   │
│  4. N₂O Projeto      → Eq.16-31                           │
│  5. CH₄ Baseline     → Eq.11-14 (entérico + esterco +    │
│                        queima)                             │
│  6. CH₄ Projeto      → Eq.11-14                           │
│  7. CO₂ Projeto      → Eq.6-9 (combustíveis + calagem)    │
│  8. VCUs             → ER + CR - LK - UNC - buffer pool   │
└───────────────────────────────────────────────────────────┘
    │
    ▼
 ResultadoMotor (com todos os intermediários em detalhesCalculo)
```

---

## 🔗 Matching Control Sites — 9 Critérios VM0042

```
CS selecionado + Fazenda selecionada
    │
    ▼
┌─────────────────────────────────────────┐
│  C1  Distância ≤ 250km      (Haversine)│
│  C2  Zona climática IPCC    (mesma)    │
│  C3  Ecorregião WWF         (mesma)    │
│  C4  Textura FAO            (mesma)    │
│  C5  Grupo solo WRB         (mesmo)    │
│  C6  Declividade + aspecto  (mesma)    │
│  C7  Precipitação ±100mm    (MAR)      │
│  C8  SOC% médio             (t-test)   │
│  C9  Histórico ALM 5 anos   (intersec) │
└─────────────────────────────────────────┘
    │
    ▼
 score = (aprovados / 9) × 100
    │
    ├──≥78 (≥7/9) → "coberta"
    ├──≥44 (≥4/9) → "parcial"
    └──<44         → "descoberta"
```

---

## 🔐 Autenticação e Permissões

```
Rotas Públicas              Rotas Protegidas (AuthGuard)
─────────────────           ────────────────────────────
/simulacao                  /dashboard/*        → role: cliente
/login                      /parceiro/*         → role: parceiro
/criar-conta                /admin/*            → role: admin
/recuperar-senha

Redirect "/":
  admin    → /admin
  cliente  → /dashboard
  parceiro → /parceiro
  Guest    → /simulacao
```

---

## 📊 Status de Entidades

### Lead
```
novo → em_analise → aprovado → contratado → efetivado
                        ↘ recusado (motivo obrigatório)
```

### MRV (Dados de Manejo)
```
rascunho → pendente → aprovado (travado)
                 ↘ correcao → pendente (resubmissão)
```

### Control Site
```
Ativo | Em_implantacao | Inativo
```

---

*Gerado a partir do DevGuideV4.md — Venture Carbon · Abril 2026*