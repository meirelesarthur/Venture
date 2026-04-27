// ─── Motor Orquestrador Principal ────────────────────────────────────────────
// Roda RothC + N2O + CH4 + CO2 + Créditos para um talhão × ano agrícola

import { rodarRothC } from './rothc'
import { calcularN2O } from './n2o'
import { calcularCH4 } from './ch4'
import { calcularCO2 } from './co2'
import { calcularCreditos } from './creditos'
import type { DadosManejoAnual, Talhao, DadoClimatico, ParametroSistema, ResultadoMotor } from '../store/data'

export type LogCallback = (step: string, percent: number) => void

// ─── Tipo público dos intermediários de cálculo ───────────────────────────────
import type { DetalheCombustivel, DetalheCal } from './co2'
import type { ParcelaER } from './creditos'

interface RothCIntermediarios {
  socTotal: number; iom: number; socAtivo: number; inputC: number
  hiUsado: number; raizPa: number; bioAerea: number; bioRaiz: number
  yieldTHa: number; fracDPM: number; fracRPM: number; tipoInput: string
  dpmRpmRatio: number; xParticao: number; fracCO2: number; fracBioHum: number
  fatorA_mes1: number; tempC_mes1: number; fatorB_mes1: number
  maxTSMD: number; fatorC_mes1: number
  k_DPM: number; k_RPM: number; k_BIO: number; k_HUM: number
  compFinalDPM: number; compFinalRPM: number; compFinalBIO: number
  compFinalHUM: number; compFinalIOM: number
  deltaSoc: number; co2Eq: number; socPorAno: number[]
}

interface N2OProjIntermediarios {
  ef1Usado: number; zonaClimatica: string; temInibidor: boolean
  totalNSint: number; totalNOrg: number; totalNFert: number
  n2oDireto: number; nVolatSint: number; nVolatOrg: number; nVolatTotal: number
  ef4: number; n2oVolat: number; nLeachTotal: number; fracLeach: number
  ef5: number; n2oLeach: number; fManure: number; efEsterco: number
  n2oEsterco: number; bioMassaLeg: number; nContent: number
  fCrBnf: number; efBnf: number; n2oBnf: number; n2oTotal: number
}

interface N2OBaseIntermediarios {
  totalNFert: number; ef1Usado: number; n2oDireto: number
  n2oIndireto: number; n2oEsterco: number; n2oBnf: number; n2oTotal: number
}

interface CH4ProjIntermediarios {
  gwpCH4: number; popAnimais: number; efEntMedioKgCab: number
  ch4EntKgTotal: number; ch4Enterico: number; vsRateMedio: number
  efCH4md: number; ch4EstercoKgHa: number; ch4Esterco: number
  bioAeraeResd: number; cf: number; mbQueimado: number
  efCH4bb: number; ch4QueimaKgHa: number; ch4Queima: number
}

interface CH4BaseIntermediarios {
  gwpCH4: number; popAnimais: number
  ch4Enterico: number; ch4Esterco: number; ch4Queima: number; ch4Total: number
}

interface CO2ProjIntermediarios {
  efDiesel: number; efGasolina: number; detalhesCombust: DetalheCombustivel[]
  co2Ff: number; efCalcitico: number; efDolomitico: number
  fatorCCO2: number; detalhesCalc: DetalheCal[]; co2Lime: number
}

interface CO2BaseIntermediarios {
  detalhesCombust: DetalheCombustivel[]; co2Ff: number
  detalhesCalc: DetalheCal[]; co2Lime: number
}

interface CreditosIntermediarios {
  parcelasER: ParcelaER[]; erTBruto: number; uncCo2: number; uncN2o: number
  deltaCO2SocNet: number; iSinal: number; crTBruto: number
  uncCo2AplicadaCR: number; fpdsUsado: number; hasPecuariaLeakage: boolean
  lkDetalhado: string; deducaoUncCO2: number
  deducaoUncN2O: number; errNetStep: string; vcusStep: string
}

export interface DetalhesCalculo {
  rothcBase: RothCIntermediarios
  rothcProj: RothCIntermediarios
  n2oProj: N2OProjIntermediarios
  n2oBase: N2OBaseIntermediarios
  ch4Proj: CH4ProjIntermediarios
  ch4Base: CH4BaseIntermediarios
  co2Proj: CO2ProjIntermediarios
  co2Base: CO2BaseIntermediarios
  creditos: CreditosIntermediarios
}

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
        cultura: manejoProj.cultura ?? 'soja',
        produtividade: (manejoProj.produtividade ?? 60) * 0.85,
        unidadeProd: manejoProj.unidadeProd,
        dataPlantio: manejoProj.dataPlantio,
        dataColheita: manejoProj.dataColheita,
        residuosCampo: false,
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

    // ─── Intermediários para transparência total de equações ────────────────
    detalhesCalculo: {
      // RothC — Baseline
      rothcBase: {
        socTotal:     resultBase.intermediarios.socTotalTcHa,
        iom:          resultBase.intermediarios.iomTcHa,
        socAtivo:     resultBase.intermediarios.socAtivoTcHa,
        inputC:       resultBase.intermediarios.inputCTcHaAno,
        hiUsado:      resultBase.intermediarios.hiUsado ?? 0,
        raizPa:       resultBase.intermediarios.raizPaUsado,
        bioAerea:     resultBase.intermediarios.bioAereaTHa,
        bioRaiz:      resultBase.intermediarios.bioRaizTHa,
        yieldTHa:     resultBase.intermediarios.yieldTHa,
        fracDPM:      resultBase.intermediarios.fracDPM,
        fracRPM:      resultBase.intermediarios.fracRPM,
        tipoInput:    resultBase.intermediarios.tipoInput,
        dpmRpmRatio:  resultBase.intermediarios.dpmRpmRatio,
        xParticao:    resultBase.intermediarios.xParticionamento,
        fracCO2:      resultBase.intermediarios.fracCO2,
        fracBioHum:   resultBase.intermediarios.fracBioHum,
        fatorA_mes1:  resultBase.intermediarios.fatorA_mes1,
        tempC_mes1:   resultBase.intermediarios.tempC_mes1,
        fatorB_mes1:  resultBase.intermediarios.fatorB_mes1,
        maxTSMD:      resultBase.intermediarios.maxTSMD,
        fatorC_mes1:  resultBase.intermediarios.fatorC_mes1,
        k_DPM: resultBase.intermediarios.k_DPM,
        k_RPM: resultBase.intermediarios.k_RPM,
        k_BIO: resultBase.intermediarios.k_BIO,
        k_HUM: resultBase.intermediarios.k_HUM,
        compFinalDPM: resultBase.intermediarios.compartimentosFinalDPM,
        compFinalRPM: resultBase.intermediarios.compartimentosFinalRPM,
        compFinalBIO: resultBase.intermediarios.compartimentosFinalBIO,
        compFinalHUM: resultBase.intermediarios.compartimentosFinalHUM,
        compFinalIOM: resultBase.intermediarios.compartimentosFinalIOM,
        deltaSoc:     resultBase.deltaSocTcHa,
        co2Eq:        resultBase.co2Tco2eHa,
        socPorAno:    resultBase.socPorAno,
      },
      // RothC — Projeto
      rothcProj: {
        socTotal:     resultProj.intermediarios.socTotalTcHa,
        iom:          resultProj.intermediarios.iomTcHa,
        socAtivo:     resultProj.intermediarios.socAtivoTcHa,
        inputC:       resultProj.intermediarios.inputCTcHaAno,
        hiUsado:      resultProj.intermediarios.hiUsado ?? 0,
        raizPa:       resultProj.intermediarios.raizPaUsado,
        bioAerea:     resultProj.intermediarios.bioAereaTHa,
        bioRaiz:      resultProj.intermediarios.bioRaizTHa,
        yieldTHa:     resultProj.intermediarios.yieldTHa,
        fracDPM:      resultProj.intermediarios.fracDPM,
        fracRPM:      resultProj.intermediarios.fracRPM,
        tipoInput:    resultProj.intermediarios.tipoInput,
        dpmRpmRatio:  resultProj.intermediarios.dpmRpmRatio,
        xParticao:    resultProj.intermediarios.xParticionamento,
        fracCO2:      resultProj.intermediarios.fracCO2,
        fracBioHum:   resultProj.intermediarios.fracBioHum,
        fatorA_mes1:  resultProj.intermediarios.fatorA_mes1,
        tempC_mes1:   resultProj.intermediarios.tempC_mes1,
        fatorB_mes1:  resultProj.intermediarios.fatorB_mes1,
        maxTSMD:      resultProj.intermediarios.maxTSMD,
        fatorC_mes1:  resultProj.intermediarios.fatorC_mes1,
        k_DPM: resultProj.intermediarios.k_DPM,
        k_RPM: resultProj.intermediarios.k_RPM,
        k_BIO: resultProj.intermediarios.k_BIO,
        k_HUM: resultProj.intermediarios.k_HUM,
        compFinalDPM: resultProj.intermediarios.compartimentosFinalDPM,
        compFinalRPM: resultProj.intermediarios.compartimentosFinalRPM,
        compFinalBIO: resultProj.intermediarios.compartimentosFinalBIO,
        compFinalHUM: resultProj.intermediarios.compartimentosFinalHUM,
        compFinalIOM: resultProj.intermediarios.compartimentosFinalIOM,
        deltaSoc:     resultProj.deltaSocTcHa,
        co2Eq:        resultProj.co2Tco2eHa,
        socPorAno:    resultProj.socPorAno,
      },
      // N2O — Projeto
      n2oProj: {
        ef1Usado:          n2oProj.ef1Usado,
        zonaClimatica:     n2oProj.zonaClimaticaUsada,
        temInibidor:       n2oProj.temInibidor,
        totalNSint:        n2oProj.totalNKgHaSint,
        totalNOrg:         n2oProj.totalNKgHaOrg,
        totalNFert:        n2oProj.totalNKgHaFert,
        n2oDireto:         n2oProj.n2oFertDirectTco2eHa,
        nVolatSint:        n2oProj.nVolatSint,
        nVolatOrg:         n2oProj.nVolatOrg,
        nVolatTotal:       n2oProj.nVolatTotal,
        ef4:               n2oProj.ef4Usado,
        n2oVolat:          n2oProj.n2oVolatTco2eHa,
        nLeachTotal:       n2oProj.nLeachTotal,
        fracLeach:         n2oProj.fracLeachUsado,
        ef5:               n2oProj.ef5Usado,
        n2oLeach:          n2oProj.n2oLeachTco2eHa,
        fManure:           n2oProj.fManureTotalKgNHa,
        efEsterco:         n2oProj.efEstercoUsado,
        n2oEsterco:        n2oProj.n2oEstercoTco2eHa,
        bioMassaLeg:       n2oProj.bioMassaLeguminosa,
        nContent:          n2oProj.nContentCultura ?? 0,
        fCrBnf:            n2oProj.fCrBnfKgNHa,
        efBnf:             n2oProj.efBnfUsado,
        n2oBnf:            n2oProj.n2oBnfTco2eHa,
        n2oTotal:          n2oProj.n2oTotalTco2eHa,
      },
      // N2O — Baseline
      n2oBase: {
        totalNFert:   n2oBase.totalNKgHaFert,
        ef1Usado:     n2oBase.ef1Usado,
        n2oDireto:    n2oBase.n2oFertDirectTco2eHa,
        n2oIndireto:  n2oBase.n2oFertIndirectTco2eHa,
        n2oEsterco:   n2oBase.n2oEstercoTco2eHa,
        n2oBnf:       n2oBase.n2oBnfTco2eHa,
        n2oTotal:     n2oBase.n2oTotalTco2eHa,
      },
      // CH4 — Projeto
      ch4Proj: {
        gwpCH4:           ch4Proj.gwpCH4Usado,
        popAnimais:       ch4Proj.popTotalAnimais,
        efEntMedioKgCab:  ch4Proj.ch4EntKgCabAno,
        ch4EntKgTotal:    ch4Proj.ch4EntKgHaTotal,
        ch4Enterico:      ch4Proj.ch4EntericoTco2eHa,
        vsRateMedio:      ch4Proj.vsRateMedioKgDia,
        efCH4md:          ch4Proj.efCH4MdUsado,
        ch4EstercoKgHa:   ch4Proj.ch4EstercoKgHaTotal,
        ch4Esterco:       ch4Proj.ch4EstercoTco2eHa,
        bioAeraeResd:     ch4Proj.bioAereaTHa,
        cf:               ch4Proj.cfUsado,
        mbQueimado:       ch4Proj.mbQueimadoTHa,
        efCH4bb:          ch4Proj.efCH4BbUsado,
        ch4QueimaKgHa:    ch4Proj.ch4QueimaKgHa,
        ch4Queima:        ch4Proj.ch4QueimaraTco2eHa,
      },
      // CH4 — Baseline
      ch4Base: {
        gwpCH4:      ch4Base.gwpCH4Usado,
        popAnimais:  ch4Base.popTotalAnimais,
        ch4Enterico: ch4Base.ch4EntericoTco2eHa,
        ch4Esterco:  ch4Base.ch4EstercoTco2eHa,
        ch4Queima:   ch4Base.ch4QueimaraTco2eHa,
        ch4Total:    ch4Base.ch4TotalTco2eHa,
      },
      // CO2 — Projeto
      co2Proj: {
        efDiesel:         co2Proj.efDieselUsado,
        efGasolina:       co2Proj.efGasolinaUsado,
        detalhesCombust:  co2Proj.detalhesCombustiveis,
        co2Ff:            co2Proj.co2FfTco2eHa,
        efCalcitico:      co2Proj.efCalciticoUsado,
        efDolomitico:     co2Proj.efDolomiticoUsado,
        fatorCCO2:        co2Proj.fatorConversaoCCO2,
        detalhesCalc:     co2Proj.detalhesCalcario,
        co2Lime:          co2Proj.co2LimeTco2eHa,
      },
      // CO2 — Baseline
      co2Base: {
        detalhesCombust: co2Base.detalhesCombustiveis,
        co2Ff:           co2Base.co2FfTco2eHa,
        detalhesCalc:    co2Base.detalhesCalcario,
        co2Lime:         co2Base.co2LimeTco2eHa,
      },
      // Créditos — Intermediários
      creditos: {
        parcelasER:         creditos.parcelasER,
        erTBruto:           creditos.erTBrutoTco2eHa,
        uncCo2:             creditos.uncCo2,
        uncN2o:             creditos.uncN2o,
        deltaCO2SocNet:     creditos.deltaCO2SocNet,
        iSinal:             creditos.iSinal,
        crTBruto:           creditos.crTBrutoTco2eHa,
        uncCo2AplicadaCR:   creditos.uncCo2AplicadaCR,
        fpdsUsado:          creditos.fpdsUsado,
        hasPecuariaLeakage: creditos.hasPecuariaLeakage,
        lkDetalhado:        creditos.lkDetalhado,
        deducaoUncCO2:      creditos.deducaoUncCO2Tco2eHa,
        deducaoUncN2O:      creditos.deducaoUncN2OTco2eHa,
        errNetStep:         creditos.errNetStep,
        vcusStep:           creditos.vcusStep,
      },
    },
  }

  return resultado
}
