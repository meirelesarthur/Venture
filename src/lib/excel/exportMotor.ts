import * as XLSX from 'xlsx'
import type { ResultadoMotor, Talhao, Fazenda, BaselineProjeto } from '@/store/data'
import type { DetalhesCalculo } from '@/motor'

const sn = (v: unknown, dec = 4): string =>
  typeof v === 'number' ? v.toFixed(dec) : String(v ?? '—')

const pct = (v: number): string => `${(v * 100).toFixed(1)}%`

export function exportMotorXlsx(
  resultados: ResultadoMotor[],
  talhoes: Talhao[],
  fazenda: Fazenda,
  baseline?: BaselineProjeto
): void {
  if (!resultados.length) return

  const wb = XLSX.utils.book_new()

  // ── Aba 1: Resumo por talhão ──────────────────────────────────────────────────
  // Quando há baseline, inclui colunas Baseline (snap) | Projeto (atual) | Δ VCUs | Δ (%)
  const resumoHeader = [
    'Talhão', 'Área (ha)',
    'SOC Baseline (tC/ha)', 'SOC Projeto (tC/ha)', 'Δ SOC (tC/ha)',
    'N₂O Baseline', 'N₂O Projeto',
    'CH₄ Baseline', 'CH₄ Projeto',
    'VCUs/ha', 'VCUs Total (Projeto)',
    ...(baseline ? ['VCUs Baseline (snap)', 'Δ VCUs (tCO₂e)', 'Δ VCUs (%)'] : []),
  ]

  const resumoRows: string[][] = [
    resumoHeader,
    ...resultados.map(r => {
      const t = talhoes.find(x => x.id === r.talhaoId)
      const baseSnap = baseline?.resultadoSnapshot?.find(b => b.talhaoId === r.talhaoId)
      const vcusProjeto = r.vcusEmitidosTotal
      const vcusBaseline = baseSnap?.vcusEmitidosTotal ?? 0
      const deltaVcus = vcusProjeto - vcusBaseline
      const deltaPct = vcusBaseline !== 0 ? deltaVcus / vcusBaseline : 0

      return [
        t?.nome ?? r.talhaoId,
        String(t?.areaHa ?? '—'),
        sn(r.socBaselineTcHa),
        sn(r.socProjetoTcHa),
        sn(r.deltaSocTcHa),
        sn(r.n2oBaselineTco2eHa),
        sn(r.n2oProjetoTco2eHa),
        sn(r.ch4BaselineTco2eHa),
        sn(r.ch4ProjetoTco2eHa),
        sn(r.vcusEmitidosHa, 2),
        sn(r.vcusEmitidosTotal, 2),
        ...(baseline ? [
          baseSnap ? sn(vcusBaseline, 2) : '—',
          baseSnap ? sn(deltaVcus, 2) : '—',
          baseSnap ? pct(deltaPct) : '—',
        ] : []),
      ]
    }),
  ]
  const ws1 = XLSX.utils.aoa_to_sheet(resumoRows)
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumo por Talhão')

  // ── Aba 2: Equações (detalhado) ───────────────────────────────────────────────
  const eqRows: string[][] = [
    ['Módulo', 'Equação', 'Parâmetro', ...resultados.flatMap(r => {
      const t = talhoes.find(x => x.id === r.talhaoId)
      return [`${t?.nome ?? 'T'} — Base`, `${t?.nome ?? 'T'} — Proj`]
    }), 'Unidade'],
  ]

  const addRow = (mod: string, eq: string, param: string, unit: string, getter: (d: DetalhesCalculo, r: ResultadoMotor) => [unknown, unknown]) => {
    const vals = resultados.flatMap(r => {
      const d = r.detalhesCalculo as DetalhesCalculo | undefined
      if (!d) return ['—', '—']
      const [b, p] = getter(d, r)
      return [sn(b), sn(p)]
    })
    eqRows.push([mod, eq, param, ...vals, unit])
  }

  addRow('RothC', '§5.3.9', 'SOC_stock (tC/ha)', 'tC/ha', d => [d.rothcBase?.socTotal, d.rothcProj?.socTotal])
  addRow('RothC', '§5.3.7', 'IOM (tC/ha)', 'tC/ha', d => [d.rothcBase?.iom, d.rothcProj?.iom])
  addRow('RothC', '§5.3.8', 'Input_C (tC/ha/ano)', 'tC/ha/ano', d => [d.rothcBase?.inputC, d.rothcProj?.inputC])
  addRow('RothC', 'Eq.40', 'CR_t (tCO₂e/ha)', 'tCO₂e/ha', (_, r) => ['—', r.crTTco2eHa])
  addRow('N₂O', 'Eq.16', 'N₂O_total (tCO₂e/ha)', 'tCO₂e/ha', d => [d.n2oBase?.n2oTotal, d.n2oProj?.n2oTotal])
  addRow('N₂O', 'Eq.18-20', 'N_total_fertilizantes (kgN/ha)', 'kgN/ha', d => [d.n2oBase?.totalNFert, d.n2oProj?.totalNFert])
  addRow('CH₄', 'Eq.11', 'CH₄_entérico (tCO₂e/ha)', 'tCO₂e/ha', d => [d.ch4Base?.ch4Enterico, d.ch4Proj?.ch4Enterico])
  addRow('CO₂', 'Eq.7', 'CO₂_combustíveis (tCO₂e/ha)', 'tCO₂e/ha', d => [d.co2Base?.co2Ff, d.co2Proj?.co2Ff])
  addRow('CO₂', 'Eq.9', 'CO₂_calagem (tCO₂e/ha)', 'tCO₂e/ha', d => [d.co2Base?.co2Lime, d.co2Proj?.co2Lime])
  addRow('Créditos', 'Eq.37', 'ER_t (tCO₂e/ha)', 'tCO₂e/ha', (_, r) => ['—', r.erTTco2eHa])
  addRow('Créditos', 'VCUs', 'VCUs_total (tCO₂e)', 'tCO₂e', (_, r) => ['—', r.vcusEmitidosTotal])

  const ws2 = XLSX.utils.aoa_to_sheet(eqRows)
  XLSX.utils.book_append_sheet(wb, ws2, 'Equações Detalhadas')

  // ── Aba 3: Baseline vs Projeto (totais) ───────────────────────────────────────
  const totalAtual = resultados.reduce((s, r) => s + r.vcusEmitidosTotal, 0)
  const totalBase = baseline?.totalTco2e ?? 0
  const delta = totalAtual - totalBase

  const deltaRows: string[][] = [
    ['Métrica', 'Valor', 'Unidade'],
    ['VCUs emitidos (ano atual)', sn(totalAtual, 2), 'tCO₂e'],
    ['Baseline (ano zero)', baseline ? sn(totalBase, 2) : 'Não submetida', 'tCO₂e'],
    ['Baseline submetida em', baseline ? new Date(baseline.submetidaEm).toLocaleDateString('pt-BR') : '—', ''],
    ['Créditos gerados (delta)', baseline ? sn(delta, 2) : sn(totalAtual, 2), 'tCO₂e'],
  ]
  const ws3 = XLSX.utils.aoa_to_sheet(deltaRows)
  XLSX.utils.book_append_sheet(wb, ws3, 'Baseline vs Projeto')

  // ── Aba 4: Delta por Talhão ───────────────────────────────────────────────────
  // Mostra o breakdown detalhado do delta (Projeto − Baseline) por talhão
  if (baseline?.resultadoSnapshot?.length) {
    const deltaByTalhaoRows: string[][] = [
      [
        'Talhão', 'Área (ha)',
        'VCUs Baseline (tCO₂e)', 'VCUs Projeto (tCO₂e)',
        'Δ VCUs (tCO₂e)', 'Δ VCUs (%)',
        'Δ SOC (tC/ha)', 'Δ N₂O (tCO₂e/ha)', 'Δ CH₄ (tCO₂e/ha)',
        'Observação',
      ],
    ]

    for (const r of resultados) {
      const t = talhoes.find(x => x.id === r.talhaoId)
      const snap = baseline.resultadoSnapshot.find(b => b.talhaoId === r.talhaoId)

      const vcusProjeto = r.vcusEmitidosTotal
      const vcusBase = snap?.vcusEmitidosTotal ?? 0
      const dVcus = vcusProjeto - vcusBase
      const dPct = vcusBase !== 0 ? dVcus / vcusBase : 0

      const obs = !snap
        ? 'Talhão sem snapshot na baseline'
        : dVcus > 0
          ? 'Créditos gerados acima da baseline'
          : dVcus < 0
            ? 'Créditos abaixo da baseline'
            : 'Sem variação'

      deltaByTalhaoRows.push([
        t?.nome ?? r.talhaoId,
        String(t?.areaHa ?? '—'),
        snap ? sn(vcusBase, 2) : '—',
        sn(vcusProjeto, 2),
        snap ? sn(dVcus, 2) : '—',
        snap ? pct(dPct) : '—',
        sn(r.deltaSocTcHa),
        sn(r.deltaN2oTco2eHa),
        sn(r.deltaCh4Tco2eHa),
        obs,
      ])
    }

    // Linha de totais
    const totalDelta = totalAtual - totalBase
    const totalDeltaPct = totalBase !== 0 ? totalDelta / totalBase : 0
    deltaByTalhaoRows.push([
      'TOTAL', '',
      sn(totalBase, 2),
      sn(totalAtual, 2),
      sn(totalDelta, 2),
      pct(totalDeltaPct),
      '', '', '',
      'Soma de todos os talhões',
    ])

    const ws4 = XLSX.utils.aoa_to_sheet(deltaByTalhaoRows)
    XLSX.utils.book_append_sheet(wb, ws4, 'Delta por Talhão')
  }

  const filename = `motor_${fazenda.nome.replace(/\s+/g, '_')}_${resultados[0]?.anoAgricola ?? 'N/A'}.xlsx`
  XLSX.writeFile(wb, filename)
}
