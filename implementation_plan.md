# Plano de Implementação de Ajustes — Venture Carbon

Este documento descreve detalhadamente o plano para implementar 100% dos ajustes listados em `changes.md` no projeto Venture Carbon. 

## User Review Required

> [!IMPORTANT]
> **Sobre o comissionamento por parceiro:** No sistema atual, a comissão base é calculada com um valor fixo por hectare (ex: US$ 1,00/ha). Como a solicitação pede uma "comissão de X%", a abordagem proposta será adicionar um campo **`comissaoPercentual`** (ex: 100%, 120%, 80%) para cada parceiro no banco de dados (`store/data.ts`). Esse percentual multiplicará o cálculo padrão e será explicitamente exibido nas telas de "Como funciona a comissão" do Parceiro. Por favor, confirme se essa lógica atende à expectativa.

## Proposed Changes

### 1. Ajustes no Simulador
**Objetivo:** Melhorar a UX, destacar a marca e otimizar a usabilidade do mapa e da conversão.

#### [MODIFY] [SimuladorPage.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/simulador/SimuladorPage.tsx)
- Corrigir a injeção do polígono no mapa a partir do arquivo KML. Quando a etapa 2 (Área) propagar as coordenadas do KML, centralizaremos o mapa imediatamente no polígono lido.
- Remover/ajustar a dupla barra de rolagem (remover a classe de `max-h` restritiva ou `overflow-y-auto` conflitantes nas etapas filhas) para corrigir o bug de scroll na tela de **Composição Anual** da Etapa 6.

#### [MODIFY] [Step0BemVindo.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/simulador/components/Step0BemVindo.tsx)
- Inserir a imagem oficial do Logo da Venture Carbon em destaque no centro da página.
- Atualizar a Headline (título principal) para: **"Calcule quanto sua fazenda pode receber com Carbono"**.
- Adicionar texto informativo destacando que **"A análise leva menos de 5 minutos"**.

#### [MODIFY] [Step2Area.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/simulador/components/Step2Area.tsx)
- Inverter a ordem visual dos campos: O botão/upload de **Arquivo KML** e desenho no mapa será posicionado **antes** do campo de preenchimento manual de Hectares.
- Alterar o `onComplete` e `handleKmlUpload` para propagar as coordenadas centrais do geojson para o `SimuladorPage.tsx` usar no foco automático.
- Incluir alerta visual (badge ou helper text) deixando evidente a exigência de **Área Mínima de 500 hectares**.

#### [MODIFY] [Step4Praticas.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/simulador/components/Step4Praticas.tsx)
- Mover o card de "Estimativa de Ganhos" (Resultados em tempo real) para que seja exibido **antes** da lista de práticas, garantindo que o usuário sempre o tenha visível enquanto seleciona as opções (eliminando a necessidade de scroll).

#### [MODIFY] [schema.ts](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/simulador/schema.ts)
- Implementar validação `.min(500, 'Área mínima aceita é de 500 hectares')` no zod schema do simulador.

---

### 2. Fluxos do Parceiro Representante Comercial
**Objetivo:** Adicionar granularidade ao comissionamento e ajustar posições na UI.

#### [MODIFY] [store/data.ts](file:///c:/Users/Arthur/Desktop/venture-carbon/src/store/data.ts)
- Adicionar o campo `comissaoPercentual?: number` na interface `Parceiro`.
- Atualizar a store e métodos para permitir a atualização desse campo através de um painel de administração.

#### [MODIFY] [AdminParceiros.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/admin/AdminParceiros.tsx)
- Adicionar na tabela de gestão de parceiros e no modal uma funcionalidade para visualizar e **editar a comissão percentual (%)** de cada parceiro de forma individual.

#### [MODIFY] [ComissoesPage.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/parceiro/ComissoesPage.tsx) e [ParceiroDashboard.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/parceiro/ParceiroDashboard.tsx)
- Buscar a taxa de `comissaoPercentual` do parceiro logado.
- Atualizar a seção *"Como funciona a comissão?"* para destacar visualmente a **sua taxa de comissão aplicada** (ex: "Sua taxa atual é de X% sobre o valor base").

#### [MODIFY] [RankingPage.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/parceiro/RankingPage.tsx)
- Mover o bloco de visualização dos níveis (Legenda de níveis — compacta) do rodapé para o topo, posicionando-o imediatamente **antes** do box "Sua posição atual".

---

### 3. Fluxo do Produtor (Cliente)
**Objetivo:** Refinar campos de MRV para acomodar novas seções e corrigir seletores e anexos.

#### [MODIFY] [MrvPage.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/cliente/MrvPage.tsx)
- Ajustar o loop de renderização do seletor de Anos Agrícolas para mostrar apenas o valor único do ano corrente de forma decrescente (ex: "2026", "2025") em vez de "2026/2027", "2025/2026", removendo qualquer repetição.

#### [MODIFY] [PecuariaForm.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/cliente/mrv/PecuariaForm.tsx) e [store/data.ts](file:///c:/Users/Arthur/Desktop/venture-carbon/src/store/data.ts)
- Converter o tipo `dieta` na `RegistroPecuaria` de string única para `string[]`.
- Alterar o seletor visual na interface para uso de Checkboxes (Múltipla Escolha).
- Alterar as opções para: **Pasto, Silagem/Volumoso, Concentrado, Outro**.
- Implementar um input de texto livre caso o usuário marque "Outro".

#### [MODIFY] [FertilizacaoForm.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/cliente/mrv/FertilizacaoForm.tsx) e [store/data.ts](file:///c:/Users/Arthur/Desktop/venture-carbon/src/store/data.ts)
- Adicionar a opção "Outro adubo" nos selects de fertilizantes e abrir campo de texto caso selecionado (para sintéticos e orgânicos).
- Adicionar uma nova entidade de dados (`produtosBiologicos?: { nome: string }[]`) no MRV e renderizar uma **nova seção: "Produtos Biológicos"** posicionada antes de Fertilizantes Orgânicos. O campo será de preenchimento livre.
- Adicionar badges na cor vermelha com o texto *"Anexo Comprobatório Obrigatório"* ou similar sempre que houver necessidade de nota fiscal/evidência na seção.

#### [MODIFY] [DocumentosForm.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/cliente/mrv/DocumentosForm.tsx)
- Renomear o label/categoria de `Laudos de Solo (Laboratório)` para **"Laudos de Solo (agricultura de precisão)"**.
- Criar a **nova seção de Documentos Fundiários** adicionando os itens exigidos: "Matrícula atualizada", "CAR", "GEO", "CCIR", "Contratos de arrendamento e outros pertinentes".
- Reforçar o destaque para anexos obrigatórios com tags visíveis.

#### [MODIFY] [LavouraForm.tsx](file:///c:/Users/Arthur/Desktop/venture-carbon/src/pages/cliente/mrv/LavouraForm.tsx) e [store/data.ts](file:///c:/Users/Arthur/Desktop/venture-carbon/src/store/data.ts)
- Atualizar a interface `DadosManejoAnual` com `plantasCobertura`.
- Criar e renderizar a seção **Plantas de Cobertura** contendo:
  1. Tipo de cobertura (texto livre)
  2. Data de Semeadura (date)
  3. Data de Dessecação/Rolagem (date)
  4. Componente de upload para a Nota Fiscal da semente.

## Verification Plan

### Manual Verification
O processo será verificado rodando o servidor de testes (Vite) e inspecionando manualmente:
- **Simulador:** Simular um fluxo do início ao fim certificando a nova ordem (KML primeiro), verificando a centralização automática no mapa, confirmando que a estimativa sobe para o topo e checando se a "Composição Anual" rola perfeitamente ao final.
- **Parceiro:** Visitar os dashboards do parceiro e admin, aplicar taxas de comissão diferentes e certificar-se da visualização correta da regra no painel. Validar a reposição do card de níveis de ranqueamento.
- **Cliente:** Preencher abas de MRV para testar múltipla escolha de dieta, as novas seções de Biológicos, Plantas de Cobertura e os Documentos Fundiários. Checar formatações de data e destaques de obrigatoriedade.
