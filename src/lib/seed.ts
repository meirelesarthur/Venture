// Seed de dados fictícios para facilitar o teste da aplicação

export const mockLeads = [
  { id: 1, nome: 'João da Silva', fazenda: 'Fazenda Boa Vista', area: 1200, status: 'aprovado', data: '12/10/2026' },
  { id: 2, nome: 'Fazendas Reunidas Agrop.', fazenda: 'Agrop. São José', area: 5000, status: 'em_analise', data: '05/11/2026' },
  { id: 3, nome: 'Marcos Antônio', fazenda: 'Sítio das Águas', area: 850, status: 'contratado', data: '22/08/2026' },
  { id: 4, nome: 'Pedro Henrique', fazenda: 'Estância Bela', area: 300, status: 'recusado', data: '15/09/2026' },
]

export const mockComissoes = [
  { id: '1', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 0', valor: 6600, status: 'pago', dataVencimento: '15/10/2026' },
  { id: '2', fazenda: 'Sítio das Águas', parcela: 'Ano 0', valor: 4675, status: 'pago', dataVencimento: '22/08/2026' },
  { id: '3', fazenda: 'Fazenda Boa Vista', parcela: 'Ano 2', valor: 3300, status: 'projetado', dataVencimento: '15/10/2028' },
  { id: '4', fazenda: 'Sítio das Águas', parcela: 'Ano 2', valor: 2337, status: 'projetado', dataVencimento: '22/08/2028' },
]

export const mockClientes = [
  { id: '1', nome: 'João da Silva', area: 1200, statusMRV: 'Em Validação', motor: 'Pendente' },
  { id: '2', nome: 'Agrop. São José', area: 5000, statusMRV: 'Auditoria Aprovada', motor: 'Rodado' },
  { id: '3', nome: 'Marcos Antônio', area: 850, statusMRV: 'Em submissão', motor: 'N/A' },
  { id: '4', nome: 'Pedro Henrique', area: 300, statusMRV: 'Em Validação', motor: 'Pendente' },
]

export const mockControlSites = [
  { id: 1, nome: 'Site Controle Sul', area: 54, status: 'Valido', similaridade: 9, biome: 'Pampa', data: '10/01/2026' },
  { id: 2, nome: 'Site Controle Cerrado 01', area: 120, status: 'Valido', similaridade: 11, biome: 'Cerrado', data: '05/02/2026' },
  { id: 3, nome: 'Site Controle Cerrado 02', area: 85, status: 'Alerta', similaridade: 7, biome: 'Cerrado', data: '22/03/2026' },
]
