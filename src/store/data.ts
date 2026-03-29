import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type LeadStatus = 'aprovado' | 'em_analise' | 'recusado' | 'contratado' | 'efetivado'

export interface Lead {
  id: string
  parceiroId?: string
  nome: string
  email?: string
  fazenda: string
  area: number
  status: LeadStatus
  data: string
}

export interface Cliente {
  id: string
  userId?: string // ID associado ao Auth
  nome: string
  area: number
  statusMRV: string
  motor: string
}

export interface Comissao {
  id: string
  parceiroId?: string
  fazenda: string
  parcela: string
  valor: number
  status: 'pago' | 'projetado'
  dataVencimento: string
}

export interface ControlSite {
  id: string
  nome: string
  area: number
  status: string
  similaridade: number
  biome: string
  data: string
}

export interface Parceiro {
  id: string
  nome: string
  email: string
  leadsGerados: number
  comissaoTotal: number
  status: 'ativo' | 'convidado'
}

// Valores Iniciais Mocks transplantados do seed.ts
const initialLeads: Lead[] = [
  { id: '1', nome: 'João da Silva', email: 'joao@email.com', fazenda: 'Fazenda Boa Vista', area: 1200, status: 'aprovado', data: '12/10/2026' },
  { id: '2', nome: 'Fazendas Reunidas Agrop.', email: 'contato@agrop.com.br', fazenda: 'Agrop. São José', area: 5000, status: 'em_analise', data: '05/11/2026' },
  { id: '3', nome: 'Marcos Antônio', email: 'marcos@email.com', fazenda: 'Sítio das Águas', area: 850, status: 'contratado', data: '22/08/2026' },
  { id: '4', nome: 'Pedro Henrique', email: 'pedro@email.com', fazenda: 'Estância Bela', area: 300, status: 'recusado', data: '15/09/2026' },
]

const initialClientes: Cliente[] = [
  { id: '1', nome: 'João da Silva', area: 1200, statusMRV: 'Em Validação', motor: 'Pendente' },
  { id: '2', nome: 'Agrop. São José', area: 5000, statusMRV: 'Auditoria Aprovada', motor: 'Rodado' },
  { id: '3', nome: 'Marcos Antônio', area: 850, statusMRV: 'Em submissão', motor: 'N/A' },
  { id: '4', nome: 'Pedro Henrique', area: 300, statusMRV: 'Em Validação', motor: 'Pendente' },
]

const initialComissoes: Comissao[] = [
  { id: '1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 0', valor: 6600, status: 'pago', dataVencimento: '15/10/2026' },
  { id: '2', fazenda: 'Sítio das Águas', parcela: 'Ano 0', valor: 4675, status: 'pago', dataVencimento: '22/08/2026' },
  { id: '3', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 2', valor: 3300, status: 'projetado', dataVencimento: '15/10/2028' },
  { id: '4', fazenda: 'Sítio das Águas', parcela: 'Ano 2', valor: 2337, status: 'projetado', dataVencimento: '22/08/2028' },
]

const initialSites: ControlSite[] = [
  { id: '1', nome: 'Site Controle Sul', area: 54, status: 'Valido', similaridade: 9, biome: 'Pampa', data: '10/01/2026' },
  { id: '2', nome: 'Site Controle Cerrado 01', area: 120, status: 'Valido', similaridade: 11, biome: 'Cerrado', data: '05/02/2026' },
  { id: '3', nome: 'Site Controle Cerrado 02', area: 85, status: 'Alerta', similaridade: 7, biome: 'Cerrado', data: '22/03/2026' },
]

const initialParceiros: Parceiro[] = [
  { id: 'p1', nome: 'AgroConsult', email: 'contato@agroconsult.com', leadsGerados: 12, comissaoTotal: 15400, status: 'ativo' },
  { id: 'p2', nome: 'Sindicato Rural MG', email: 'sindicato@ruralmg.org', leadsGerados: 5, comissaoTotal: 3300, status: 'ativo' },
  { id: 'p3', nome: 'TechFarm Solutions', email: 'hello@techfarm.ag', leadsGerados: 0, comissaoTotal: 0, status: 'convidado' },
]

interface DataState {
  leads: Lead[]
  clientes: Cliente[]
  comissoes: Comissao[]
  controlSites: ControlSite[]
  parceiros: Parceiro[]

  addLead: (lead: Omit<Lead, 'id' | 'data'>) => void
  updateLeadStatus: (id: string, status: LeadStatus) => void
  convertLeadToCliente: (leadId: string) => void
  addControlSite: (site: Omit<ControlSite, 'id'>) => void
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      leads: initialLeads,
      clientes: initialClientes,
      comissoes: initialComissoes,
      controlSites: initialSites,
      parceiros: initialParceiros,

      addLead: (leadData) =>
        set((state) => ({
          leads: [
            ...state.leads,
            {
              ...leadData,
              id: uuidv4(),
              data: new Date().toLocaleDateString('pt-BR'),
            },
          ],
        })),

      updateLeadStatus: (id, status) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, status } : l
          ),
        })),

      convertLeadToCliente: (leadId) =>
        set((state) => {
          const lead = state.leads.find((l) => l.id === leadId)
          if (!lead) return state

          const newCliente: Cliente = {
            id: uuidv4(),
            nome: lead.nome,
            area: lead.area,
            statusMRV: 'Aberto',
            motor: 'N/A'
          }

          return {
            leads: state.leads.map((l) =>
              l.id === leadId ? { ...l, status: 'efetivado' } : l
            ),
            clientes: [...state.clientes, newCliente]
          }
        }),

      addControlSite: (siteData) =>
        set((state) => ({
          controlSites: [
            ...state.controlSites,
            {
              ...siteData,
              id: uuidv4(),
            },
          ],
        })),
    }),
    {
      name: 'venture-carbon-data',
    }
  )
)
