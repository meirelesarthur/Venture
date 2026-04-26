// Mapa prática → chave de parâmetro no store
export const PRATICA_PARAM: Record<string, string> = {
  plantio_direto: 'soc_fator_spdpd',
  cobertura:      'soc_fator_cobertura',
  rotacao:        'soc_fator_rotacao',
  ilpf:           'soc_fator_ilpf',
  pastagem:       'soc_fator_pastagem',
  organico:       'soc_fator_org',
  biologicos:     'soc_fator_biologicos',
  rotac_pasto:    'soc_fator_rotac_past',
}

// Bônus de sequestro por tipo de preparo do solo (tCO2e/ha)
export const CULTURA_BONUS: Record<string, number> = {
  plantio_direto: 2.5,
  reduzido:       1.0,
  convencional:   0,
}

// Percentual reservado ao buffer pool (desconto de risco VM0042)
export const BUFFER_POOL = 0.15

// Fallback PTAX (BRL/USD) quando a API do BCB não responde
export const PTAX_FALLBACK = 5.65

// Fator SOC padrão quando a prática não está mapeada no store
export const SOC_FATOR_FALLBACK = 0.5

// Desconto aplicado ao 2º+ práticas no cálculo de fC (evita dupla-contagem)
export const PRATICA_SECUNDARIA_MULT = 0.3

// Multiplicador do bônus de cultura sobre fC
export const CULTURA_BONUS_MULT = 0.2

// Fator mínimo de sequestro mesmo sem práticas (tCO2e/ha/ano)
export const FC_MINIMO = 0.3

// Custo operacional estimado por hectare (BRL/ha/ano)
export const CUSTO_OP_BRL_HA = 15

// Prêmio de valuation sobre receita de carbono (ex: impacto ESG)
export const PREMIO_VALUATION = 0.06

// Lista de práticas exibidas no Step4
export const PRATICAS_LIST = [
  { id: 'plantio_direto', label: 'Plantio Direto (SPD)',    desc: 'Zero revolvimento do solo' },
  { id: 'cobertura',      label: 'Plantas de Cobertura',    desc: 'Braquiária, crotalária...' },
  { id: 'rotacao',        label: 'Rotação Complexa',        desc: 'Diversificação com leguminosas' },
  { id: 'ilpf',           label: 'ILP/ILPF',                desc: 'Integração Lavoura-Pecuária-Floresta' },
  { id: 'pastagem',       label: 'Reforma de Pastagem',     desc: 'Recuperação com adição de C' },
  { id: 'organico',       label: 'Fertilizantes Orgânicos', desc: 'Substituição parcial de NPK' },
  { id: 'biologicos',     label: 'Insumos Biológicos',      desc: 'Fixadores de N / P' },
  { id: 'rotac_pasto',    label: 'Manejo Rotacionado',      desc: 'Pastejo Racional Voisin' },
] as const
