import * as z from 'zod'

export const simuladorSchema = z.object({
  localizacao: z.object({
    fazenda: z.string().min(2, 'Nome da fazenda é obrigatório'),
    estado: z.string().min(2, 'Estado é obrigatório'),
    municipio: z.string().min(2, 'Município é obrigatório'),
  }).optional(),
  lead: z.object({
    nome: z.string().min(3, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    telefone: z.string().min(10, 'Telefone inválido'),
  }),
  area: z.object({
    hectares: z.coerce.number().min(1, 'A área deve ser maior que 0').max(1000000, 'Área muito grande'),
    kmlFile: z.any().optional(), // File upload not strictly typed here for simplicity
  }),
  talhoes: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    areaHectares: z.number(),
    cultura: z.string().optional(),
    tipo_preparo: z.enum(['convencional', 'reduzido', 'direto']).optional(),
    usa_cobertura: z.boolean().optional(),
    tem_pecuaria: z.boolean().optional(),
    praticas: z.array(z.string()).optional()
  })).min(1, 'Demarque pelo menos um talhão'),
  horizonte: z.enum(['10', '20']),
})

export type SimuladorData = z.infer<typeof simuladorSchema>
