// ─── Motor Orquestrador Principal ────────────────────────────────────────────
// Roda RothC + N2O + CH4 + CO2 + Créditos para um talhão × ano agrícola

import { rodarRothC } from './rothc'
import { calcularN2O } from './n2o'
import { calcularCH4 } from './ch4'
import { calcularCO2 } from './co2'
import { calcularCreditos } from './creditos'
import type { DadosManejoAnual, Talhao, DadoClimatico, ParametroSistema, ResultadoMotor } from '../store/data'

export type LogCallback = (step: string, percent: number) => void

const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

// Converte ParametroSistema[] para Record<string, number> para facilitar acesso
function paramsToRecord(params: ParametroSistema[]): Record<string, number> {
  return Object.fromEntries(params.map(p => [p.chave, p.valor]))
}

// Clima mensal padrão Cerrado Úmido (fallback se não houver dado cadastrado)
const CLIMA_PADRAO_CERRADO_UMIDO = {
  tempMensal:   [27.2, 27.0, 26.8, 26.5, 25.2, 24.1, 23.8, 25.0, 27.0, 27.5, 27.3, 27.1],
  precipMensal: [230,  210,  200,  100,   30,   10,    5,   20,   80,  160,  210,  240 ],
  evapMensal:   [100,   90,   95,  105,   95,   85,   90,  100,  110,  115,  105,  100 ],
}

// ─── Execução completa ────────────────────────────────────────────────────────

export async function rodarMotorCompleto(
  talhao: Talhao,
  manejoProj: DadosManejoAnual,
  manejoBase: DadosManejoAnual | null,
  dadoClimatico: DadoClimatico | null,
  parametros: ParametroSistema[],
  onProgress?: LogCallback,
): Promise<Omit<ResultadoMotor, 'id'>> {
  const log = (step: string, pct: number) => onProgress?.(step, pct)
  const p = paramsToRecord(parametros)

  // Clima
  const clima = dadoClimatico
    ? dadoClimatico.tempMensal.map((t, i) => ({
        tempC: t,
        precipMm: dadoClimatico.precipMensal[i],
        evapMm:   dadoClimatico.evapMensal[i],
      }))
    : CLIMA_PADRAO_CERRADO_UMIDO.tempMensal.map((t, i) => ({
        tempC: t,
        precipMm: CLIMA_PADRAO_CERRADO_UMIDO.precipMensal[i],
        evapMm:   CLIMA_PADRAO_CERRADO_UMIDO.evapMensal[i],
      }))

  const talhaoRothC = {
    socPercent:     talhao.socPercent  ?? 2.0,
    bdGCm3:         talhao.bdGCm3     ?? 1.35,
    argilaPercent:  talhao.argilaPercent ?? 35,
    profundidadeCm: talhao.profundidadeCm,
  }

  // ── BASELINE ──────────────────────────────────────────────────────────────

  log('Carregando dados do talhão e parâmetros...', 5)
  await delay(300)

  log('Calculando SOC baseline (RothC-26.3)...', 15)
  await delay(400)

  const culturaBase = manejoBase
    ? {
        cultura:       manejoBase.cultura ?? 'soja',
        produtividade: manejoBase.produtividade,
        unidadeProd:   manejoBase.unidadeProd,
        dataPlantio:   manejoBase.dataPlantio,
        dataColheita:  manejoBase.dataColheita,
        residuosCampo: manejoBase.residuosCampo ?? false,
      }
    : {
        // Sem baseline cadastrado: assume manejo convencional (sem cobertura, sem residuos)
        cultura: manejoProj.cultura ?? 'soja',
        produtividade: (manejoProj.produtividade ?? 60) * 0.85, // 15% menos produtivo
        unidadeProd: manejoProj.unidadeProd,
        dataPlantio: manejoProj.dataPlantio,
        dataColheita: manejoProj.dataColheita,
        residuosCampo: false,  // baseline: sem manutenção de resíduos
      }

  const resultBase = rodarRothC(talhaoRothC, culturaBase, clima, 3)

  const n2oBase = calcularN2O(
    manejoBase?.fertilizantesSint ?? [{ tipo: 'ureia', qtdKgHa: 100, usaInibidor: false }],
    manejoBase?.fertilizantesOrg  ?? [],
    manejoBase?.pecuaria ?? [],
    culturaBase,
    talhao.fazendaId.startsWith('f3') ? 'tropical_seco' : 'tropical_umido',
    manejoBase?.usaIrrigacao ?? false,
    p, talhao.areaHa,
  )

  const ch4Base = calcularCH4(
    manejoBase?.pecuaria ?? [],
    culturaBase, p, talhao.areaHa,
  )

  const co2Base = calcularCO2(
    manejoBase?.operacoes  ?? [{ operacao: 'plantio', combustivel: 'diesel', litros: 12 }],
    manejoBase?.calcario ?? [],
    p,
  )

  log('SOC baseline calculado. Iniciando cenário projeto...', 30)
  await delay(400)

  // ── PROJETO ────────────────────────────────────────────────────────────────

  log('Calculando SOC projeto (RothC-26.3)...', 40)
  await delay(400)

  const culturaProj = {
    cultura:       manejoProj.cultura ?? 'soja',
    produtividade: manejoProj.produtividade,
    unidadeProd:   manejoProj.unidadeProd,
    dataPlantio:   manejoProj.dataPlantio,
    dataColheita:  manejoProj.dataColheita,
    residuosCampo: manejoProj.residuosCampo ?? true,
  }

  const resultProj = rodarRothC(talhaoRothC, culturaProj, clima, 3)

  log('Módulo N2O — fertilizantes, esterco, fixação biológica...', 55)
  await delay(350)

  const zonaClimatica = talhao.fazendaId === 'f3' ? 'tropical_seco' : 'tropical_umido'
  const n2oProj = calcularN2O(
    manejoProj.fertilizantesSint ?? [],
    manejoProj.fertilizantesOrg  ?? [],
    manejoProj.pecuaria ?? [],
    culturaProj, zonaClimatica,
    manejoProj.usaIrrigacao ?? false,
    p, talhao.areaHa,
  )

  log('Módulo CH4 — entérico, esterco, queima de biomassa...', 65)
  await delay(300)

  const ch4Proj = calcularCH4(
    manejoProj.pecuaria ?? [],
    culturaProj, p, talhao.areaHa,
  )

  log('Módulo CO2 — combustíveis e calagem...', 72)
  await delay(250)

  const co2Proj = calcularCO2(
    manejoProj.operacoes ?? [],
    manejoProj.calcario  ?? [],
    p,
  )

  log('Aplicando conservadorismo nos fatores de emissão (VM0042 §8.6.3)...', 80)
  await delay(300)

  // ── DELTAS (baseline - projeto, positivo = vantagem do projeto) ────────────

  const deltas = {
    deltaCO2Ff:      co2Base.co2FfTco2eHa    - co2Proj.co2FfTco2eHa,
    deltaCO2Lime:    co2Base.co2LimeTco2eHa  - co2Proj.co2LimeTco2eHa,
    deltaCH4Ent:     ch4Base.ch4EntericoTco2eHa - ch4Proj.ch4EntericoTco2eHa,
    deltaCH4Md:      ch4Base.ch4EstercoTco2eHa  - ch4Proj.ch4EstercoTco2eHa,
    deltaCH4Bb:      ch4Base.ch4QueimaraTco2eHa - ch4Proj.ch4QueimaraTco2eHa,
    deltaN2oSoil:    n2oBase.n2oTotalTco2eHa    - n2oProj.n2oTotalTco2eHa,
    deltaN2oBb:      0,
    // SOC
    deltaCO2SocWp:   resultProj.co2Tco2eHa,
    deltaCO2SocBsl:  resultBase.co2Tco2eHa,
  }

  log('Calculando ER_t + CR_t - LK_t + incerteza VMD0053...', 88)
  await delay(300)

  const hasLaudoSolo = talhao.dadosValidados
  const hasPecuaria  = (manejoProj.pecuaria ?? []).length > 0
  const creditos = calcularCreditos(deltas, talhao.areaHa, p, hasLaudoSolo, hasPecuaria)

  log('Aplicando buffer pool e finalizando VCUs...', 95)
  await delay(200)

  log(`✅ Concluído! ${creditos.vcusEmitidosTotal.toFixed(1)} VCUs emitidos`, 100)

  const resultado: Omit<ResultadoMotor, 'id'> = {
    talhaoId:            talhao.id,
    anoAgricola:         manejoProj.anoAgricola,
    cenario:             'ambos',

    socBaselineTcHa:     resultBase.socPorAno[resultBase.socPorAno.length - 1],
    socProjetoTcHa:      resultProj.socPorAno[resultProj.socPorAno.length - 1],
    deltaSocTcHa:        resultProj.deltaSocTcHa - resultBase.deltaSocTcHa,
    co2SocTco2eHa:       creditos.crTTco2eHa,

    n2oBaselineTco2eHa:  n2oBase.n2oTotalTco2eHa,
    n2oProjetoTco2eHa:   n2oProj.n2oTotalTco2eHa,
    deltaN2oTco2eHa:     deltas.deltaN2oSoil,

    ch4BaselineTco2eHa:  ch4Base.ch4TotalTco2eHa,
    ch4ProjetoTco2eHa:   ch4Proj.ch4TotalTco2eHa,
    deltaCh4Tco2eHa:     ch4Base.ch4TotalTco2eHa - ch4Proj.ch4TotalTco2eHa,

    co2FfTco2eHa:        co2Proj.co2FfTco2eHa,
    co2LimeTco2eHa:      co2Proj.co2LimeTco2eHa,

    erTTco2eHa:          creditos.erTTco2eHa,
    crTTco2eHa:          creditos.crTTco2eHa,
    lkTTco2eHa:          creditos.lkTTco2eHa,
    uncCo2:              creditos.uncCo2,
    uncN2o:              creditos.uncN2o,
    errNetTco2eHa:       creditos.errNetTco2eHa,
    bufferPoolRate:      creditos.bufferPoolRate,
    vcusEmitidosHa:      creditos.vcusEmitidosHa,
    vcusEmitidosTotal:   creditos.vcusEmitidosTotal,

    rodadoEm:            new Date().toISOString(),
    versaoMotor:         '1.0.0-ts',
    parametrosUsados:    {
      gwp_ch4: p['gwp_ch4'], gwp_n2o: p['gwp_n2o'],
      buffer_pool: p['buffer_pool'], ef1_n2o_default: p['ef1_n2o_default'],
    },
  }

  return resultado
}
