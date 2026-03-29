/**
 * Venture Carbon - Motor de Cálculos (Frontend Library Mock/Stub)
 * Baseado na Metodologia Verra VM0042 (Seção 9)
 * 
 * ATENÇÃO: Os cálculos reais exigem processamento intensivo do modelo RothC 
 * com dados diários de clima e solo projetados para cada estrato espacial.
 * Este arquivo serve como um contrato de interface e aproximação para a demo visual.
 */

export interface SimulationParams {
  areaHa: number;
  clayPercentage: number;
  horizonteAnos: number;
  fertilizanteNSinteticoKg: number;
  combustivelDieselLitros: number;
}

export interface SimulationResult {
  vcuTotal: number;
  vcuPorAno: number[];
  socAcumulado: number;
  n2oEmissions: number;
  fossilEmissions: number;
}

// 7.1 Módulo RothC Simplificado (Projeção SOC)
export function calculateSOC(params: SimulationParams, praticas: string[]): number {
  // Apenas uma regra simplificada do comportamento: Solo argiloso estabiliza mais CO2.
  const clayFactor = Math.min((params.clayPercentage / 100) * 1.5, 2.0);
  
  // Práticas afetam a constante de partição no RothC
  let practicesScore = 0;
  if (praticas.includes('plantio_direto')) practicesScore += 1.2;
  if (praticas.includes('cobertura')) practicesScore += 0.8;
  if (praticas.includes('ilpf')) practicesScore += 2.5;

  // SocDelta = (área * score * fatorArgila) ton C/ha 
  // Convertemos C para CO2 equivalente (multiplicando por 44/12 -> ~3.67)
  const socDeltaC = params.areaHa * practicesScore * clayFactor;
  const socDeltaCO2e = socDeltaC * 3.667;

  return socDeltaCO2e * params.horizonteAnos;
}

// 7.2 Módulo N2O (Seção 11) - Baseado no IPCC Tier 1 (Modificado por VM0042)
export function calculateN2OEmissions(nSyntheticKg: number): number {
  const emissionFactorDirect = 0.01; // 1% do N aplicado
  const fractionVolatilized = 0.10; // 10%
  const emissionFactorVolatilized = 0.01; // EF4
  const gwpN2O = 298; // Potencial de Aquecimento Global N2O (GWP 100-yr)

  // Emissões diretas N2O (kg N2O-N)
  const directEmissionsN = nSyntheticKg * emissionFactorDirect;
  
  // Emissões indiretas por volatilização (kg N2O-N)
  const indirectEmissionsN = nSyntheticKg * fractionVolatilized * emissionFactorVolatilized;

  // CO2e = (N2O-N * 44/28) * GWP
  const totalN2OKg = (directEmissionsN + indirectEmissionsN) * (44 / 28);
  const totalCO2eKg = totalN2OKg * gwpN2O;

  return totalCO2eKg / 1000; // Retorna em tCO2e
}

// 7.3 Emissões Mecanizadas Fósseis (Seção 12)
export function calculateFossilEmissions(dieselLitros: number): number {
  // Diesel ~2.68 kg CO2/litro
  const dieselCO2Factor = 2.68;
  const totalFossilCO2eKg = dieselLitros * dieselCO2Factor;

  return totalFossilCO2eKg / 1000; // Retorna em tCO2e
}

// 7.4 VCU Final - Saldo Líquido
export function runCalculationEngine(params: SimulationParams, praticas: string[]): SimulationResult {
  const socAcumulado = calculateSOC(params, praticas);
  const n2oEmissions = calculateN2OEmissions(params.fertilizanteNSinteticoKg) * params.horizonteAnos;
  const fossilEmissions = calculateFossilEmissions(params.combustivelDieselLitros) * params.horizonteAnos;

  // ΔGHG = ΔSOC - E_N2O - E_Fossil - Leakage
  const leakage = socAcumulado * 0.05; // 5% deduction (simplification)
  const ghgNet = socAcumulado - n2oEmissions - fossilEmissions - leakage;

  // Aplicação do Buffer Pool (ex: 15%)
  const bufferPool = 0.15;
  const vcuTotal = ghgNet > 0 ? ghgNet * (1 - bufferPool) : 0;

  // Distribuição Linear Simples (No mundo real a curva de acumulação do RothC é assintótica)
  const vcuPorAno = Array(params.horizonteAnos).fill(vcuTotal / params.horizonteAnos);

  return {
    vcuTotal: Math.round(vcuTotal),
    vcuPorAno: vcuPorAno.map(v => Math.round(v)),
    socAcumulado: Math.round(socAcumulado),
    n2oEmissions: Math.round(n2oEmissions),
    fossilEmissions: Math.round(fossilEmissions)
  };
}
