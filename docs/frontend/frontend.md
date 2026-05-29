# FluxFund Web

Frontend do **FluxFund**, aplicação SaaS de gestão financeira desenvolvida com **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **shadcn/ui**, **Axios** e **TanStack React Query**.

> Documento atualizado em **28/05/2026** para refletir as features já implementadas, as decisões de UX da operação financeira e o roadmap até autenticação e comercialização.

---

# Objetivo do Frontend

O frontend do FluxFund deve transformar uma operação baseada em planilhas em uma experiência clara, auditável e rápida para usuários financeiros.

A interface atual prioriza:

- cadastro das entidades financeiras básicas;
- importação OFX e classificação de lançamentos;
- gestão de alocações, anexos e compromissos fixos;
- dashboard de pendências;
- relatórios visualmente próprios para cada finalidade;
- exportação Excel para conferência externa;
- preparação para login, organização ativa e permissões.

---

# Stack

## Core

- React
- TypeScript
- Vite

## UI

- Tailwind CSS v4
- shadcn/ui
- Radix UI
- Lucide React
- Sonner

## Dados

- Axios
- TanStack React Query

## Forms

- React Hook Form
- Zod
- `@hookform/resolvers`

---

# Estado Atual das Features

| Feature / página | Estado | Observação |
|---|---|---|
| Layout, sidebar e rotas | Implementado | Navegação administrativa base. |
| Accounts | Implementado | CRUD integrado ao backend. |
| Categories | Implementado | CRUD e uso nos fluxos financeiros. |
| Funds | Implementado | CRUD e relatório de fundos. |
| Beneficiaries | Implementado | CRUD e uso em alocações/prestação. |
| Financial Transactions | Implementado | Fluxo principal da operação. |
| Importação OFX | Implementado | Importação e posterior classificação. |
| Classificação e alocações | Implementado | Inclui Fundo Padrão e alocação restante explícita. |
| Attachments | Implementado | Upload/listagem/download/delete em transações. |
| Settings | Implementado | Configuração de Fundo Padrão/Caixa Base. |
| Support Agreements | Implementado | Tela de compromissos e ações de ativação/desativação. |
| Dashboard | Implementado | Métricas e atalhos para pendências. |
| Relatórios | Implementado | Categoria, fundos e prestação/sustento. |
| Prestação por banco | Implementado | Expansão por favorecido > fundo > banco. |
| Excel Prestação | Implementado | Download estilizado do relatório de sustento. |
| Excel Movimento Financeiro | Implementado | Recebidas, pagas e transações baixadas. |
| Login/organização ativa | Próximo bloco | Ainda existe `TEMP_ORGANIZATION_ID`. |

---

# Variáveis de Ambiente

Arquivo `.env` na raiz do frontend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

---

# Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

Desenvolvimento local:

```text
http://localhost:5173
```

---

# Organização por Feature

Estrutura esperada:

```text
src/
├── api/
│   └── http-client.ts
├── app/
│   └── query-client.ts
├── components/
│   ├── layout/
│   ├── pagination/
│   ├── form/
│   └── ui/
├── features/
│   ├── accounts/
│   ├── categories/
│   ├── funds/
│   ├── beneficiaries/
│   ├── financial-transactions/
│   ├── attachments/
│   ├── organization-settings/
│   ├── support-agreements/
│   ├── dashboard/
│   └── reports/
├── pages/
├── routes/
├── types/
└── utils/
```

Padrão por feature:

```text
features/nome-da-feature/
├── nome-api.ts
├── nome-types.ts
├── nome-labels.ts
├── nome-schema.ts
├── hooks/
└── components/
```

As features usam `httpClient`, não `axios` diretamente.

---

# Integração com API e React Query

Cliente HTTP:

```text
src/api/http-client.ts
```

Até a implementação de login, as chamadas utilizam a API sem header de autenticação real e algumas features ainda enviam `TEMP_ORGANIZATION_ID`.

## Query keys importantes

As mutations devem invalidar as consultas afetadas.

Exemplos:

```text
["financial-transactions"]
["transaction-attachments", transactionId]
["support-agreements"]
["accountability-report"]
["accountability-by-account-report"]
```

Regra para anexos na tabela de transações:

```text
Upload/delete de attachment deve invalidar tanto a lista de anexos
quanto a consulta de financial-transactions,
pois a coluna Docs depende dos contadores de anexos retornados pela transação.
```

---

# Layout Principal e Rotas

Layout:

```text
AppLayout
├── AppSidebar
├── AppHeader
└── Outlet
```

Rotas implementadas/esperadas:

```text
/
/accounts
/categories
/funds
/beneficiaries
/transactions
/settings
/support-agreements
/reports
/reports/category-result
/reports/funds
/reports/accountability
```

Próximas rotas de autenticação:

```text
/login
/users ou /settings/users
```

---

# Regras de Negócio refletidas na UI

## Account x Fund

```text
Account = dinheiro real / banco / caixa.
Fund = destinação interna / projeto / orçamento.
```

A UI não deve tratar fundo como conta bancária.

## FinancialTransaction

- `description` é a descrição editável/amigável;
- `rawDescription` preserva o texto original do OFX/banco;
- a listagem prioriza `description`, mostrando origem bancária como detalhe quando relevante;
- canceladas não aparecem por padrão.

## A classificar

```text
category == null && status != CANCELED
```

Comportamento operacional desejado na tabela:

```text
Clique na linha a classificar -> abre modal Classificar.
Clique na linha já classificada -> abre modal Detalhes.
Clique no menu de ações -> não dispara clique da linha.
```

## A alocar

```text
status = SETTLED
category != null
type != TRANSFER
transação ainda não totalmente alocada
```

A tela diferencia visualmente:

- alocada;
- parcial;
- a alocar.

## Fundo Padrão / Caixa Base

Na classificação:

```text
Sem alocação manual -> backend pode alocar 100% no fundo padrão configurado.
Alocação parcial -> restante continua pendente.
```

Existe ação explícita para alocar o restante no fundo padrão.

## Compromissos Fixos

Na tela de compromissos, o usuário gerencia compromissos mensais vinculados a favorecido e fundo.

Operações:

- cadastrar;
- editar;
- desativar;
- reativar;
- filtrar ativos, inativos ou todos.

Atenção de implementação:

```text
Ao selecionar “Todos”, a API não deve enviar active=true por padrão.
O parâmetro active só deve ser enviado quando o filtro for Ativos ou Inativos.
```

---

# TransactionsPage — Tela Operacional Principal

A tela de transações é o principal ambiente de trabalho financeiro e deve priorizar rapidez e escaneabilidade.

## Layout decidido

```text
PageHeader
  -> Importar OFX
  -> Nova transação
  -> Exportar Excel (abre dialog de período)

Barra compacta de filtros
  -> busca
  -> tipo
  -> status
  -> sem categoria
  -> sem alocação
  -> filtros avançados recolhíveis

Card da tabela
  -> quantidade encontrada
  -> page size
  -> ordenação
  -> tabela
```

Não manter um card grande permanente para exportação, pois isso empurra a tabela para baixo.

## Colunas recomendadas da tabela

```text
Situação | Data | Tipo | Descrição | Conta | Categoria | Valor | Alocação | Docs | Ações
```

Regras visuais:

- descrição truncada para não dominar a tabela;
- data deve aparecer no início do fluxo de leitura;
- badges de status/tipo/alocação dão cor e prioridade visual;
- ações permanecem acessíveis pelo menu;
- coluna `Docs` informa documentação disponível.

## Indicador de anexos/documentos

A tabela deve sinalizar:

```text
Sem anexo                       -> neutro
Somente comprovante pagamento   -> indicador de comprovante
Possui anexo fiscal/documental  -> destaque positivo
Despesa baixada sem fiscal      -> alerta visual
```

Isso ajuda a localizar gastos que ainda precisam de nota, recibo ou documentação fiscal.

## Anexo pendente no Classificar

Regra de UX:

```text
Sem arquivo selecionado -> pode salvar.
Arquivo enviado -> pode salvar.
Arquivo selecionado mas não enviado -> mostrar aviso e impedir salvar.
```

O upload é opcional; apenas não deve existir seleção esquecida aguardando envio.

---

# Attachments

A feature de anexos está integrada ao fluxo de transações.

Tipos suportados:

```text
RECEIPT
INVOICE
PROOF_OF_PAYMENT
CONTRACT
OTHER
```

Locais de uso:

- modal de detalhes: leitura/download;
- modal de classificação: upload durante conferência;
- ação “Anexos”: gestão específica após classificação/liquidação.

Comportamento React Query:

```text
upload/delete -> invalidar attachments da transação
             -> invalidar financial-transactions para atualizar coluna Docs
```

---

# Support Agreements / Compromissos

Rota:

```text
/support-agreements
```

Objetivo:

```text
Gerenciar compromissos fixos de sustento por favorecido e fundo.
```

A feature possui:

- tabela com filtros por ativo/inativo/todos;
- criação e edição em dialog;
- desativação lógica;
- ação de reativação;
- integração com o relatório de prestação.

Atalho futuro opcional:

```text
Ação dentro de Favorecidos para abrir/cadastrar compromissos daquele beneficiário.
```

---

# Relatórios

## ReportsPage

Central de relatórios, não dashboard. Deve apresentar cards de navegação e disponibilidade.

## Resultado por Categoria

Rota:

```text
/reports/category-result
```

Visual:

- demonstrativo hierárquico;
- receitas e despesas separadas;
- categorias pai/filhas;
- expandir/recolher grupos.

## Fundos e Projetos

Rota:

```text
/reports/funds
```

Visual:

- painel de projetos;
- cards por fundo;
- destaque para saldos negativos;
- navegação para transações filtradas pelo fundo.

## Prestação de Contas / Sustento

Rota:

```text
/reports/accountability
```

Regra de negócio atual:

```text
commitmentAmount  = compromissos fixos válidos no período
allocatedAmount   = ofertas destinadas
payableAmount     = compromisso + ofertas
transferredAmount = repasses/utilizações
pendingAmount     = total devido - repassado
```

Estrutura visual decidida:

```text
Card do favorecido: resumo sempre visível
  -> Fundos vinculados recolhíveis
      -> Bancos recolhíveis dentro de cada fundo
```

Controles:

- expandir/recolher todos os favorecidos;
- contagem de fundos no botão;
- contagem de bancos quando os detalhes estiverem carregados;
- carregamento por banco não deve mostrar `0` antes da consulta terminar.

O detalhamento bancário mostra movimentações reais. O compromisso fixo não deve ser artificialmente atribuído a um banco.

---

# Exportações Excel

## Prestação / Sustento

Botão na tela do relatório chama download `.xlsx` estilizado com abas:

- Resumo por favorecido;
- Fundos por favorecido;
- Detalhamento por banco.

## Movimento Financeiro

Na `TransactionsPage`, a exportação abre dialog de período e baixa `.xlsx` com:

- Resumo;
- Contas Recebidas;
- Contas Pagas;
- Todas as Transações.

A aba de contas pagas deve ajudar a conferir documentos fiscais/anexos.

## Exportações futuras

Depois de login e segurança:

- Excel do relatório de Fundos;
- Excel do Resultado por Categoria;
- PDF formal da Prestação;
- CSV somente se surgir necessidade real de integração externa.

---

# Multi-Tenant Temporário e Próximo Passo

Atualmente, algumas APIs ainda usam:

```ts
const TEMP_ORGANIZATION_ID = "..."
```

Isso é temporário e não é aceitável em produção ou venda.

Próximo fluxo:

```text
Login JWT
-> sessão autenticada
-> seleção de organização ativa
-> Axios inclui token e contexto da organização
-> backend valida membership/role
-> remoção do TEMP_ORGANIZATION_ID
```

---

# Login, Permissões e Auditoria — Roadmap Imediato

## Fase 1 — Autenticação

Frontend:

- página `/login`;
- formulários com validação;
- armazenamento seguro da sessão definido no projeto;
- interceptor do Axios com bearer token;
- `ProtectedRoute`;
- logout;
- tratamento de sessão expirada.

## Fase 2 — Organização ativa

- buscar organizações disponíveis para o usuário;
- seletor no header;
- contexto/store de organização ativa;
- invalidar queries ao trocar organização;
- remover constantes temporárias.

## Fase 3 — Roles

Esconder/desabilitar ações conforme role, sem depender apenas do frontend; o backend deve ser a fonte final de autorização.

Papéis:

```text
OWNER
ADMIN
FINANCE
VIEWER
```

## Fase 4 — Usuários e administração

- tela para usuários da organização;
- convite/criação;
- alteração de role;
- remoção/desativação de acesso.

---

# Roadmap para Produto Vendável

Após piloto interno seguro:

- recuperação/troca de senha;
- onboarding de organizações;
- storage em nuvem para documentos;
- logs e monitoramento;
- backup/restauração;
- testes automatizados dos fluxos financeiros críticos;
- configuração de logo/nome nos relatórios;
- regras configuráveis de documentos obrigatórios;
- política de privacidade/retenção;
- exportação completa dos dados de cada organização;
- planos e cobrança apenas quando a base estiver madura.

---

# Próximo Passo Recomendado

Após confirmar os últimos testes da `TransactionsPage` e fazer commit:

```text
Implementar login JWT no backend e depois integrar /login no frontend.
```

Evitar iniciar novos gráficos ou telas cosméticas antes de autenticação, organização ativa e permissões.

