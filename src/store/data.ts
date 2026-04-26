import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export type {
  LeadStatus, MrvStatus,
  Lead, Fazenda, Talhao,
  FertilizanteSint, FertilizanteOrg, Calcario, OperacaoMec, RegistroPecuaria,
  CulturaManejo, PlantaCobertura, DadosManejoAnual,
  Cliente, Comissao,
  ZonaClimaticaIPCC, ClasseDeclividade, AspectoCar, ClasseTexturaFAO, GestorTipo,
  HistoricoManejoAnual, ControlSite, MatchResult,
  Parceiro, ColetaSolo, CampoAlterado, EventoHistorico,
  ParametroSistema, ResultadoMotor, DadoClimatico,
  Notificacao, Alerta, UserRole, AppUser,
} from './types'

import type {
  LeadStatus, MrvStatus,
  Lead, Fazenda, Talhao, DadosManejoAnual, Cliente, Comissao,
  ControlSite, MatchResult, Parceiro, ColetaSolo, EventoHistorico,
  ParametroSistema, ResultadoMotor, DadoClimatico,
  Notificacao, Alerta, AppUser,
} from './types'

import {
  initialParametros, initialLeads, initialClientes, initialFazendas,
  initialTalhoes, initialManejo, initialComissoes, initialSites,
  initialParceiros, initialUsuarios, initialClimaticos,
  initialResultados, initialHistorico, initialAlertas,
} from './initial-data'

// ─── Store interface ───────────────────────────────────────────────────────────

interface DataState {
  leads: Lead[]
  clientes: Cliente[]
  fazendas: Fazenda[]
  talhoes: Talhao[]
  manejo: DadosManejoAnual[]
  comissoes: Comissao[]
  controlSites: ControlSite[]
  matchResults: MatchResult[]
  parceiros: Parceiro[]
  parametros: ParametroSistema[]
  resultadosMotor: ResultadoMotor[]
  dadosClimaticos: DadoClimatico[]
  notificacoes: Notificacao[]
  alertas: Alerta[]
  usuarios: AppUser[]
  coletasSolo: ColetaSolo[]
  historicoFazendas: EventoHistorico[]

  // Parceiros
  addParceiro: (p: Omit<Parceiro, 'id'>) => void
  updateParceiro: (id: string, changes: Partial<Parceiro>) => void

  // Lead
  addLead: (lead: Omit<Lead, 'id' | 'data'>) => string
  updateLeadStatus: (id: string, status: LeadStatus, motivo?: string) => void
  convertLeadToCliente: (leadId: string) => void

  // Fazenda / Talhão
  addFazenda: (f: Omit<Fazenda, 'id'>) => string
  updateFazenda: (id: string, changes: Partial<Fazenda>, obs?: string) => void
  addTalhao: (t: Omit<Talhao, 'id'>) => string
  updateTalhao: (id: string, changes: Partial<Talhao>, obs?: string) => void

  // Coleta de Solo
  addColetaSolo: (c: Omit<ColetaSolo, 'id'>) => string
  updateColetaSolo: (id: string, changes: Partial<ColetaSolo>) => void
  deleteColetaSolo: (id: string) => void

  // Histórico (append-only)
  addEventoHistorico: (e: Omit<EventoHistorico, 'id'>) => void

  // MRV
  saveManejoRascunho: (data: Omit<DadosManejoAnual, 'id' | 'versao'>) => string
  updateManejo: (id: string, changes: Partial<DadosManejoAnual>) => void
  submitManejo: (id: string) => void
  approveManejo: (id: string) => void
  requestCorrection: (id: string, comentario: string) => void

  // Control Sites
  addControlSite: (site: Omit<ControlSite, 'id'>) => void
  updateControlSite: (id: string, changes: Partial<ControlSite>) => void

  // Matching CS ↔ Fazenda
  addMatchResult: (r: Omit<MatchResult, 'id'>) => string
  clearMatchResults: (controlSiteId: string) => void
  getMatchResultsForFazenda: (fazendaId: string) => MatchResult[]

  // Parâmetros
  setParametro: (chave: string, valor: number, fonte?: string) => void
  getParam: (chave: string) => number

  // Motor
  addResultadoMotor: (r: Omit<ResultadoMotor, 'id'>) => string
  clearResultadosTalhao: (talhaoId: string, ano: number) => void

  // Clima
  saveDadoClimatico: (dado: Omit<DadoClimatico, 'id' | 'atualizadoEm'>) => void

  // Notificações
  addNotificacao: (n: Omit<Notificacao, 'id' | 'criadaEm' | 'lida'>) => void
  marcarLida: (id: string) => void
  marcarTodasLidas: (para: Notificacao['para']) => void

  // Alertas
  addAlerta: (a: Omit<Alerta, 'id' | 'criadoEm' | 'resolvido'>) => void
  resolverAlerta: (id: string) => void

  // Usuários
  addUsuario: (u: Omit<AppUser, 'id'>) => void
  updateUsuario: (id: string, changes: Partial<AppUser>) => void

  // Util
  resetToInitialData: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialState = () => ({
  leads: initialLeads,
  clientes: initialClientes,
  fazendas: initialFazendas,
  talhoes: initialTalhoes,
  manejo: initialManejo,
  comissoes: initialComissoes,
  controlSites: initialSites,
  parceiros: initialParceiros,
  parametros: initialParametros,
  resultadosMotor: initialResultados,
  dadosClimaticos: initialClimaticos,
  notificacoes: [] as Notificacao[],
  alertas: initialAlertas,
  usuarios: initialUsuarios,
  coletasSolo: [] as ColetaSolo[],
  historicoFazendas: initialHistorico,
  matchResults: [] as MatchResult[],
})

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      // ── Lead ──────────────────────────────────────────────────
      addLead: (leadData) => {
        const id = uuidv4()
        set((state) => ({
          leads: [...state.leads, { ...leadData, id, data: new Date().toLocaleDateString('pt-BR') }],
        }))
        return id
      },

      updateLeadStatus: (id, status, motivo) =>
        set((state) => ({
          leads: state.leads.map((l) => l.id === id ? { ...l, status, motivoRecusa: motivo } : l),
        })),

      convertLeadToCliente: (leadId) =>
        set((state) => {
          const lead = state.leads.find((l) => l.id === leadId)
          if (!lead) return state
          const newCliente: Cliente = {
            id: uuidv4(), nome: lead.nome, email: lead.email,
            area: lead.area, statusMRV: 'Aberto', motor: 'N/A',
          }
          const ptax = state.parametros.find(p => p.chave === 'ptax_fallback')?.valor ?? 5.65
          const comissaoBase = state.parametros.find(p => p.chave === 'comissao_base_usd_ha')?.valor ?? 1.00
          const valorUsd = lead.area * comissaoBase
          const newComissao: Comissao = {
            id: uuidv4(),
            parceiroId: lead.parceiroId ?? '',
            leadId: lead.id,
            fazenda: lead.fazenda,
            parcela: 'Ano 0',
            anoPagamento: new Date().getFullYear(),
            valor: valorUsd * ptax,
            valorUsd,
            baseCalculo: `${lead.area} ha × US$ ${comissaoBase}/ha × R$ ${ptax}`,
            status: 'projetado',
            dataVencimento: new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString('pt-BR'),
          }
          return {
            leads: state.leads.map((l) => l.id === leadId ? { ...l, status: 'efetivado' } : l),
            clientes: [...state.clientes, newCliente],
            comissoes: lead.parceiroId ? [...state.comissoes, newComissao] : state.comissoes,
          }
        }),

      // ── Fazenda/Talhão ────────────────────────────────────────
      addFazenda: (f) => {
        const id = uuidv4()
        set((state) => ({ fazendas: [...state.fazendas, { ...f, id }] }))
        return id
      },

      updateFazenda: (id, changes, obs?) => {
        const state = get()
        const antes = state.fazendas.find(f => f.id === id)
        set((s) => ({ fazendas: s.fazendas.map((f) => f.id === id ? { ...f, ...changes } : f) }))
        if (antes) {
          const admin = state.usuarios.find(u => u.role === 'Super Admin') ?? state.usuarios[0]
          const campos = (Object.keys(changes) as (keyof Fazenda)[]).map(campo => ({
            campo, valorAnterior: antes[campo], valorNovo: changes[campo],
          }))
          if (campos.length > 0) {
            get().addEventoHistorico({
              fazendaId: id, timestampUtc: new Date().toISOString(),
              usuarioId: admin?.id ?? 'admin', usuarioNome: admin?.nome ?? 'Admin',
              tipoAtor: 'venture_carbon', camposAlterados: campos, observacao: obs,
            })
          }
        }
      },

      addTalhao: (t) => {
        const id = uuidv4()
        set((state) => ({ talhoes: [...state.talhoes, { ...t, id }] }))
        return id
      },

      updateTalhao: (id, changes, obs?) => {
        const state = get()
        const antes = state.talhoes.find(t => t.id === id)
        set((s) => ({ talhoes: s.talhoes.map((t) => t.id === id ? { ...t, ...changes } : t) }))
        if (antes) {
          const fazendaId = antes.fazendaId
          const admin = state.usuarios.find(u => u.role === 'Super Admin') ?? state.usuarios[0]
          const campos = (Object.keys(changes) as (keyof Talhao)[]).map(campo => ({
            campo: `[${antes.nome}] ${campo}`,
            valorAnterior: antes[campo],
            valorNovo: changes[campo],
          }))
          if (campos.length > 0) {
            get().addEventoHistorico({
              fazendaId, timestampUtc: new Date().toISOString(),
              usuarioId: admin?.id ?? 'admin', usuarioNome: admin?.nome ?? 'Admin',
              tipoAtor: 'venture_carbon', camposAlterados: campos, observacao: obs,
            })
          }
        }
      },

      // ── Coleta de Solo ────────────────────────────────────────
      addColetaSolo: (c) => {
        const id = uuidv4()
        set((state) => ({ coletasSolo: [...state.coletasSolo, { ...c, id }] }))
        return id
      },

      updateColetaSolo: (id, changes) =>
        set((state) => ({
          coletasSolo: state.coletasSolo.map(c => c.id === id ? { ...c, ...changes } : c),
        })),

      deleteColetaSolo: (id) =>
        set((state) => ({ coletasSolo: state.coletasSolo.filter(c => c.id !== id) })),

      // ── Histórico append-only ─────────────────────────────────
      addEventoHistorico: (e) =>
        set((state) => ({
          historicoFazendas: [{ ...e, id: uuidv4() }, ...state.historicoFazendas],
        })),

      // ── MRV ──────────────────────────────────────────────────
      saveManejoRascunho: (data) => {
        const existing = get().manejo.find(
          (m) => (data.talhaoId ? m.talhaoId === data.talhaoId : m.fazendaId === data.fazendaId)
            && m.anoAgricola === data.anoAgricola && m.cenario === data.cenario
        )
        if (existing) {
          set((state) => ({
            manejo: state.manejo.map((m) =>
              m.id === existing.id ? { ...m, ...data, versao: m.versao } : m
            ),
          }))
          return existing.id
        }
        const id = uuidv4()
        set((state) => ({ manejo: [...state.manejo, { ...data, id, versao: 1 }] }))
        return id
      },

      updateManejo: (id, changes) =>
        set((state) => ({
          manejo: state.manejo.map((m) => m.id === id ? { ...m, ...changes } : m),
        })),

      submitManejo: (id) =>
        set((state) => ({
          manejo: state.manejo.map((m) =>
            m.id === id ? { ...m, status: 'pendente', submetidoEm: new Date().toISOString() } : m
          ),
        })),

      approveManejo: (id) => {
        set((state) => ({
          manejo: state.manejo.map((m) =>
            m.id === id ? { ...m, status: 'aprovado', versao: m.versao + 1, aprovadoEm: new Date().toISOString() } : m
          ),
        }))
        const m = get().manejo.find(x => x.id === id)
        if (m) get().addNotificacao({ para: 'cliente', texto: `Seus dados MRV (Safra ${m.anoAgricola}/${m.anoAgricola+1}) foram aprovados! O motor de cálculos pode ser executado.`, link: '/dashboard/mrv' })
      },

      requestCorrection: (id, comentario) => {
        set((state) => ({
          manejo: state.manejo.map((m) =>
            m.id === id ? { ...m, status: 'correcao', comentarioCorrecao: comentario } : m
          ),
        }))
        get().addNotificacao({ para: 'cliente', texto: `Correção solicitada nos seus dados MRV. Acesse o MRV para revisar: "${comentario.slice(0,60)}..."`, link: '/dashboard/mrv' })
      },

      // ── Control Sites ─────────────────────────────────────────
      addControlSite: (siteData) =>
        set((state) => ({
          controlSites: [...state.controlSites, {
            ...siteData,
            id: uuidv4(),
            data_cadastro: siteData.data_cadastro ?? new Date().toISOString(),
          }],
        })),

      updateControlSite: (id, changes) =>
        set((state) => ({
          controlSites: state.controlSites.map((s) => s.id === id ? { ...s, ...changes } : s),
        })),

      // ── Matching CS ↔ Fazenda ─────────────────────────────────
      addMatchResult: (r) => {
        const id = uuidv4()
        set((state) => ({
          matchResults: [
            ...state.matchResults.filter(
              x => !(x.controlSiteId === r.controlSiteId && x.fazendaId === r.fazendaId)
            ),
            { ...r, id },
          ],
        }))
        return id
      },

      clearMatchResults: (controlSiteId) =>
        set((state) => ({
          matchResults: state.matchResults.filter(r => r.controlSiteId !== controlSiteId),
        })),

      getMatchResultsForFazenda: (fazendaId) =>
        get().matchResults.filter(r => r.fazendaId === fazendaId),

      // ── Parâmetros ────────────────────────────────────────────
      setParametro: (chave, valor, fonte) =>
        set((state) => ({
          parametros: state.parametros.map((p) =>
            p.chave === chave ? { ...p, valor, fonte: fonte ?? p.fonte } : p
          ),
        })),

      getParam: (chave) => {
        const p = get().parametros.find((x) => x.chave === chave)
        return p?.valor ?? 0
      },

      // ── Motor ─────────────────────────────────────────────────
      addResultadoMotor: (r) => {
        const id = uuidv4()
        set((state) => ({ resultadosMotor: [...state.resultadosMotor, { ...r, id }] }))
        return id
      },

      clearResultadosTalhao: (talhaoId, ano) =>
        set((state) => ({
          resultadosMotor: state.resultadosMotor.filter(
            (r) => !(r.talhaoId === talhaoId && r.anoAgricola === ano)
          ),
        })),

      // ── Parceiros ─────────────────────────────────────────────
      addParceiro: (p) =>
        set((state) => ({
          parceiros: [...state.parceiros, { ...p, id: uuidv4() }],
        })),

      updateParceiro: (id, changes) =>
        set((state) => ({
          parceiros: state.parceiros.map((p) => p.id === id ? { ...p, ...changes } : p),
        })),

      // ── Clima ─────────────────────────────────────────────────
      saveDadoClimatico: (dado) => {
        const id = uuidv4()
        const atualizadoEm = new Date().toISOString()
        set((state) => ({
          dadosClimaticos: [
            ...state.dadosClimaticos.filter((d) => d.talhaoId !== dado.talhaoId),
            { ...dado, id, atualizadoEm },
          ],
        }))
      },

      // ── Notificações ──────────────────────────────────────────
      addNotificacao: (n) =>
        set((state) => ({
          notificacoes: [
            { ...n, id: uuidv4(), criadaEm: new Date().toISOString(), lida: false },
            ...state.notificacoes,
          ],
        })),

      marcarLida: (id) =>
        set((state) => ({
          notificacoes: state.notificacoes.map((n) => n.id === id ? { ...n, lida: true } : n),
        })),

      marcarTodasLidas: (para) =>
        set((state) => ({
          notificacoes: state.notificacoes.map((n) =>
            n.para === para ? { ...n, lida: true } : n
          ),
        })),

      // ── Alertas ───────────────────────────────────────────────
      addAlerta: (a) =>
        set((state) => ({
          alertas: [
            { ...a, id: uuidv4(), criadoEm: new Date().toISOString(), resolvido: false },
            ...state.alertas,
          ],
        })),

      resolverAlerta: (id) =>
        set((state) => ({
          alertas: state.alertas.map((a) => a.id === id ? { ...a, resolvido: true } : a),
        })),

      // ── Usuários ──────────────────────────────────────────────
      addUsuario: (u) =>
        set((state) => ({
          usuarios: [...state.usuarios, { ...u, id: uuidv4() }],
        })),

      updateUsuario: (id, changes) =>
        set((state) => ({
          usuarios: state.usuarios.map((u) => u.id === id ? { ...u, ...changes } : u),
        })),

      // ── Util ──────────────────────────────────────────────────
      resetToInitialData: () => set(initialState()),
    }),
    {
      name: 'venture-carbon-data',
      version: 5,
      migrate: () => initialState(),
    }
  )
)
