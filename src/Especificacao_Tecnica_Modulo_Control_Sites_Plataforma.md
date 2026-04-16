# SPEC: Módulo Baseline Control Sites
> Base normativa: VM0042 v2.2 | VT0014 v1.0 | VT0009 v1.0 | Venture Carbon | Abril 2026

---

## 1. Objetivo do Módulo

Três problemas a resolver:
1. Ao cadastrar control site → calcular raio de cobertura automaticamente
2. Ao ingressar nova fazenda → verificar cobertura por control site existente
3. Gerar alertas quando cobertura insuficiente ou novos control sites necessários

### Perfis de Usuário
| Perfil | Permissão |
|---|---|
| Equipe Venture Carbon | CRUD completo |
| Parceiros comerciais | Consulta de cobertura |
| Auditores/VVB | Somente leitura |

---

## 2. Entidades de Dados

### 2.1 ControlSite

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| `id` | UUID | Sim | Auto |
| `nome` | String | Sim | — |
| `poligono` | GeoJSON/WKT | Sim | EPSG:4326 |
| `area_ha` | Float | Auto | Calculada do polígono |
| `centroide_lat` | Float | Auto | Calculada |
| `centroide_lng` | Float | Auto | Calculada |
| `zona_climatica_ipcc` | Enum | Sim | `Tropical Moist`, `Tropical Dry`, `Warm Temperate Moist`, etc. |
| `ecorregiao_wwf` | String | Sim | Código/nome ecorregião WWF |
| `classe_textural_fao` | Enum | Sim | `Sandy`, `Loamy`, `Clayey`, etc. — prof. 0–30 cm |
| `grupo_solo_wrb` | String | Sim | Ex: `Ferralsol`, `Acrisol`, `Latossolo` |
| `classe_declividade` | Enum | Sim | `Nearly level`, `Gently sloping`, `Strongly sloping`, `Moderately steep`, `Steep`, `Very steep` |
| `aspecto_cardinal` | Enum | **Condicional** | `N,NE,E,SE,S,SW,W,NW` — **obrigatório se `classe_declividade >= Moderately steep`** |
| `precip_media_anual_mm` | Float | Sim | Fonte: INMET ou ERA5/NASA POWER |
| `fonte_precip` | String | Sim | Ex: `INMET estacao X`, `ERA5 grid Y` |
| `dist_estacao_meteo_km` | Float | Sim | **Máx 50 km**; se > 50 km, usar gridded |
| `soc_medio_pct` | Float | Sim | SOC médio (% peso seco), prof. 0–30 cm |
| `soc_ic_lower` | Float | Sim | Limite inferior IC 90% do SOC |
| `soc_ic_upper` | Float | Sim | Limite superior IC 90% do SOC |
| `n_amostras_soc` | Integer | Sim | Mínimo 3; recomendado 5+ |
| `historico_manejo` | JSON | Sim | Últimos 5 anos — ver estrutura abaixo |
| `cobertura_historica` | String | Condicional | Se houve conversão nos últimos 50 anos |
| `ano_conversao` | Integer | Condicional | Ano da conversão |
| `gestor_nome` | String | Sim | — |
| `gestor_tipo` | Enum | Sim | `proponente`, `parceiro`, `externo` |
| `status` | Enum | Sim | `Ativo`, `Em_implantacao`, `Inativo` |
| `data_cadastro` | Date | Auto | — |
| `data_primeira_coleta` | Date | Não | — |

#### Estrutura JSON `historico_manejo` (por ano, últimos 5):
```json
{
  "ano": 2023,
  "preparo_solo": "plantio_direto",
  "tipo_cultura": "soja",
  "grupo_funcional": "leguminosa",
  "remocao_residuos": false,
  "esterco": false,
  "composto": false,
  "irrigacao": false
}
```

### 2.2 QuantificationUnit (Fazenda/Talhão)

Mesmos campos geofísicos do ControlSite.

**Vinculação**: tabela N:N `ControlSite ↔ QuantificationUnit`, armazenando:
- `score_similaridade` (0–100%)
- resultado de cada um dos 9 critérios

---

## 3. Motor de Matching Automático

**Executa em dois cenários:**
- **(A)** Novo control site cadastrado → quais fazendas ele atende
- **(B)** Nova fazenda ingressada → quais control sites a cobrem

### 3.1 Algoritmo — 9 Critérios (todos devem passar)

| # | Critério | Teste | Fonte |
|---|---|---|---|
| 1 | **Distância** | `haversine(centroide_cs, centroide_qu) <= 250 km` | Calculado |
| 2 | **Zona climática IPCC** | `cs.zona_climatica == qu.zona_climatica` | Layer IPCC |
| 3 | **Ecorregião WWF** | `cs.ecorregiao == qu.ecorregiao` | Layer WWF |
| 4 | **Classe textural FAO** | `cs.classe_textural == qu.classe_textural` | SoilGrids / lab |
| 5 | **Grupo solo WRB** | `cs.grupo_solo == qu.grupo_solo` | SoilGrids / lab |
| 6 | **Declividade** | `cs.classe_declividade == qu.classe_declividade` AND (se `>= moderately_steep`: `|aspecto_diff| <= 30°`) | DEM processado |
| 7 | **Precipitação** | `abs(cs.precip - qu.precip) <= 100 mm` | INMET / ERA5 / NASA POWER |
| 8 | **SOC médio** | `teste_t_bilateral(cs.soc, qu.soc, alpha=0.10)` → não significativo | Dados de laboratório |
| 9 | **Histórico manejo** | `match_historico(cs.historico, qu.historico, anos=5)` | Cadastro + imagens satélite |

**`MATCH = TRUE`** somente se **todos os 9 critérios passam**.

**Score**: `criterios_atendidos / 9 × 100%`

### 3.2 Regras do Matching de Histórico de Manejo (Critério 9)

Para cada um dos últimos 5 anos, **todas** as condições devem ser verdadeiras:

1. Mesmo tipo de preparo de solo (`plantio_direto` vs `convencional` vs `conservacao`)
2. Mesmo **grupo funcional** de cultura: `gramineas`, `leguminosas`, `broadleaf_nao_leguminosa` (conforme VMD0053)
3. Mesma resposta para `remocao_residuos`, `esterco`, `composto`, `irrigacao` (Y/N)

> **Regra VM0042**: Se a cultura exata difere mas o grupo funcional é o mesmo (ex: soja e feijão = ambas leguminosas), o critério **é atendido**.

---

## 4. Cálculo Automático da Zona de Cobertura

Executado ao submeter novo control site. Usa layers GIS pré-carregados.

### 4.1 Layers GIS Necessários

| Layer | Fonte | Formato | Atualização |
|---|---|---|---|
| Zonas climáticas IPCC | IPCC / CRU | Vetor | Estático |
| Ecorregiões terrestres | WWF / RESOLVE | Vetor | Estático |
| Classes texturais FAO | SoilGrids 250m (ISRIC) | Raster 250m | Estático |
| Grupos de solo WRB | SoilGrids 250m (ISRIC) | Raster 250m | Estático |
| DEM (elevação) | SRTM 30m ou ALOS | Raster 30m | Estático |
| Precipitação média anual | ERA5-Land / CHIRPS | Raster ~5–10 km | Anual |
| Limites municipais BR | IBGE | Vetor | Estático |

### 4.2 Pipeline (8 Passos)

```
Passo 1 — Buffer de distância
  → Gerar buffer de 250 km ao redor do centroide do control site

Passo 2 — Filtro zona climática IPCC
  → Intersectar buffer × layer IPCC
  → Manter só zona(s) que coincidem com cs.zona_climatica

Passo 3 — Filtro ecorregião WWF
  → Intersectar resultado × layer WWF
  → Manter só ecorregiao do control site

Passo 4 — Filtro textura do solo (FAO)
  → Intersectar × raster SoilGrids
  → Manter só pixels da mesma classe textural

Passo 5 — Filtro grupo de solo (WRB)
  → Intersectar × raster WRB
  → Manter só pixels do mesmo grupo de referência

Passo 6 — Filtro declividade
  → Calcular slope do DEM
  → Reclassificar conforme Tabela 10 da VM0042
  → Manter só pixels na mesma classe de declividade

Passo 7 — Filtro precipitação
  → Intersectar × raster precipitação
  → Manter só pixels onde abs(precip_pixel - cs.precip) <= 100 mm

Passo 8 — Polígono final
  → Converter resultado raster → vetor
  → Este é o polígono de zona de cobertura geofísica
```

> **Critérios 8 (SOC) e 9 (manejo)** não se resolvem por layers GIS — são avaliados pontualmente por fazenda. O polígono do Passo 8 = **cobertura geofísica máxima**; cobertura efetiva depende ainda do matching de SOC e manejo.

### 4.3 Renderização no Mapa

| Estado | Visual |
|---|---|
| Zona de cobertura geofísica | Polígono semi-transparente na cor do control site |
| Fazenda coberta (9/9 critérios) | Marcador **verde** + link ao control site |
| Fazenda parcialmente coberta (geofísico OK, falta SOC ou manejo) | Marcador **amarelo** + tooltip com critério(s) pendente(s) |
| Fazenda descoberta | Marcador **vermelho** |

Ao clicar no polígono: popup com dados do control site, nº de fazendas vinculadas e lista de critérios.

---

## 5. Fontes de Dados Meteorológicos (Brasil)

Implementar **fallback automático**:

```
1º → INMET (se estação < 50 km)
2º → ERA5-Land (se não houver estação INMET próxima)
Documentar automaticamente: fonte + distância no registro do control site
```

| Fonte | Cobertura/Resolução | Variável | Prioridade |
|---|---|---|---|
| INMET (rede convencional) | ~600 estações BR | Temp, precip, umidade, vento | **1ª** (se < 50 km) |
| ERA5-Land (ECMWF) | Global, ~9 km, 1950–presente | Temp, precip, radiação, umidade | **2ª** (gridded) |
| NASA POWER | Global, ~55 km, diário | Temp, precip, radiação solar | **3ª** (gridded) |
| CHIRPS | Global tropical, ~5 km | Somente precipitação | Complementar |
| Xavier et al. (2016) | Brasil, ~25 km, 1980–2015 | Temp, precip, radiação | Histórico BR |

---

## 6. Validações e Alertas

### 6.1 Validações ao Cadastrar Control Site

- [ ] `area_ha >= 5 ha` → alerta se `< 20 ha` (possível efeito de borda)
- [ ] Pelo menos **3 control sites ativos** no projeto antes da 1ª verificação
- [ ] Pelo menos **1 control site por estrato** definido no projeto
- [ ] `dist_estacao_meteo_km <= 50 km` OU fonte gridded documentada
- [ ] `n_amostras_soc >= 3` (recomendado 5+) por estrato
- [ ] `historico_manejo` com **5 anos** preenchidos

### 6.2 Alertas Automáticos

| Nível | Condição |
|---|---|
| 🔴 VERMELHO | Menos de 3 control sites ativos no projeto |
| 🔴 VERMELHO | Algum estrato sem control site vinculado |
| 🟡 AMARELO | Menos de 10 control sites (impacto na incerteza) |
| 🟡 AMARELO | Fazenda ingressante sem cobertura de control site |
| 🔵 AZUL | Control site com zona de cobertura que poderia atender mais fazendas não vinculadas |

---

## 7. API Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/control-sites` | Cadastrar novo control site (dispara cálculo automático da zona de cobertura) |
| `GET` | `/api/control-sites/{id}` | Detalhe com zona de cobertura e fazendas vinculadas |
| `GET` | `/api/control-sites/{id}/coverage` | GeoJSON da zona de cobertura geofísica |
| `POST` | `/api/control-sites/{id}/match` | Matching contra fazenda candidata (body: dados da fazenda) |
| `GET` | `/api/control-sites/check-coverage?lat=X&lng=Y` | Verificar se ponto está coberto |
| `POST` | `/api/farms/{id}/find-control-sites` | Todos control sites que cobrem uma fazenda |
| `GET` | `/api/projects/{id}/coverage-report` | Relatório: % área coberta, gaps, alertas |
| `PUT` | `/api/control-sites/{id}/samples` | Registrar coleta de solo |
| `GET` | `/api/control-sites/{id}/history` | Histórico de coletas e dados SOC |

---

## 8. Dashboard de Cobertura

Exibir em tempo real:

- Mapa interativo com zonas de cobertura de todos os control sites ativos (polígonos coloridos)
- **KPI**: Total de control sites ativos
- **KPI**: % da área total do projeto coberta por ≥ 1 control site
- **KPI**: Nº de estratos sem control site vinculado
- **KPI**: Nº de fazendas descobertas (sem matching completo)
- **Lista de gaps**: fazendas/regiões sem cobertura + sugestão de localização ideal para novo control site
- **Timeline de coletas**: próximas datas de amostragem planejadas por control site

---

## 9. Considerações de Implementação

### 9.1 Performance do Cálculo de Zona de Cobertura

- Pré-processar layers em tiles otimizados: **Cloud Optimized GeoTIFF** (rasters), **MVT** (vetores)
- Executar cálculo como **job assíncrono** (pode levar 30–120s)
- **Cachear** o polígono resultante no banco; recalcular somente quando atributos do control site mudam
- Usar **PostGIS** para operações espaciais no backend

### 9.2 Teste Estatístico de SOC (Critério 8)

```
Input:  média, desvio padrão, n de amostras — de ambos os lados (cs e fazenda)
Teste:  t bilateral, alpha = 0.10 (IC 90%, conforme VM0042)
PASS:   p > 0.10  → não significativamente diferentes
FAIL:   p <= 0.10 → diferença significativa
PENDENTE: fazenda sem dados de SOC → cobertura classificada como parcial (amarelo)
```

### 9.3 Integração com Módulo MRV / DSM (VT0014)

- Amostras de solo do control site → disponibilizadas automaticamente para validação do modelo DSM
- Cálculo de remoções líquidas (Eq. 6 do VT0014) → puxa `delta_SOC` dos control sites vinculados automaticamente
- Variância dos control sites → propagada no cálculo de incerteza (Eq. 7 do VT0014)

---

*Confidencial | Venture Carbon | Uso interno — software house contratada*