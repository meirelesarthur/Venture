export const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] as const

export const TEXTURAS = [
  'arenosa', 'franco-arenosa', 'franca', 'franco-argilosa',
  'argilo-arenosa', 'argilosa', 'muito-argilosa',
] as const

export const TOPOGRAFIAS = [
  'plano', 'suave_ondulado', 'ondulado', 'forte_ondulado', 'montanhoso',
] as const

export const CULTURAS = [
  'Soja', 'Milho', 'Algodão', 'Sorgo', 'Arroz',
  'Cana-de-açúcar', 'Café', 'Pastagem', 'Outro',
] as const

export interface PresetClimatico {
  tempMensal: number[]
  precipMensal: number[]
  evapMensal: number[]
}

export const PRESETS: Record<string, PresetClimatico> = {
  preset_cerrado: {
    tempMensal:   [27.2, 27.0, 26.8, 26.5, 25.2, 24.1, 23.8, 25.0, 27.0, 27.5, 27.3, 27.1],
    precipMensal: [230,  210,  200,  100,   30,   10,    5,   20,   80,  160,  210,  240],
    evapMensal:   [100,   90,   95,  105,   95,   85,   90,  100,  110,  115,  105,  100],
  },
  preset_amazonia: {
    tempMensal:   [26.5, 26.4, 26.2, 26.5, 27.0, 26.8, 26.5, 27.1, 27.5, 27.8, 27.6, 27.0],
    precipMensal: [280,  280,  320,  300,  250,  100,   70,   60,   90,  150,  200,  280],
    evapMensal:   [ 90,   80,   85,   90,   95,   90,   95,  100,  110,  115,  100,   95],
  },
  preset_pampa: {
    tempMensal:   [24.0, 23.5, 21.0, 17.0, 13.0, 10.0,  9.5, 11.5, 14.5, 18.0, 21.0, 23.0],
    precipMensal: [130,  110,  120,  100,   90,   90,  110,  100,  120,  110,  120,  130],
    evapMensal:   [140,  120,   95,   70,   45,   30,   30,   40,   60,   90,  115,  135],
  },
}
