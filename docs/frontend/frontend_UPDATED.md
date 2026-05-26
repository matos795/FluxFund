# FluxFund Web

Frontend do **FluxFund**, uma aplicação SaaS de gestão financeira desenvolvida com **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **shadcn/ui**, **Axios** e **TanStack React Query**.

Este frontend consome uma API REST em Java 21 + Spring Boot e entrega a interface administrativa para organizações, contas, categorias, fundos, favorecidos, transações, dashboard, relatórios e futuramente anexos, autenticação e multi-tenant real.

---

# Objetivo do Frontend

O frontend deve fornecer uma experiência clara para substituir planilhas financeiras complexas.

A prioridade atual é:

- manter CRUDs consistentes;
- classificar transações importadas/manual;
- gerenciar alocações por fundos e favorecidos;
- mostrar dashboard com pendências;
- mostrar relatórios com visual específico para cada tipo de análise;
- preparar caminho para anexos, login e organização real.

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
- @hookform/resolvers

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

Ambiente local:

```text
http://localhost:5173
```

---

# Estrutura de Pastas

Estrutura base:

```text
src/
├── api/
│   └── http-client.ts
├── app/
│   └── query-client.ts
├── components/
│   ├── layout/
│   ├── pagination/
│   └── ui/
├── features/
│   ├── accounts/
│   ├── categories/
│   ├── funds/
│   ├── beneficiaries/
│   ├── financial-transactions/
│   ├── dashboard/
│   └── reports/
├── pages/
├── routes/
├── types/
└── utils/
```

---

# Organização por Feature

O projeto usa organização por domínio/feature.

Padrão:

```text
features/nome-da-feature/
├── nome-api.ts
├── nome-types.ts
├── nome-labels.ts
├── nome-schema.ts
├── hooks/
└── components/
```

Exemplos atuais:

```text
features/dashboard/
features/reports/
features/financial-transactions/
```

As features não devem chamar `axios` diretamente. Elas usam:

```text
src/api/http-client.ts
```

---

# Alias de Importação

Usar `@` para imports a partir de `src`.

Exemplo:

```ts
import { Button } from "@/components/ui/button"
import { useFundReport } from "@/features/reports/hooks/use-fund-report"
```

---

# Layout Principal

O sistema usa layout administrativo:

```text
AppLayout
├── AppSidebar
├── AppHeader
└── Outlet
```

Rotas principais:

```tsx
<Route element={<AppLayout />}>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/accounts" element={<AccountsPage />} />
  <Route path="/categories" element={<CategoriesPage />} />
  <Route path="/funds" element={<FundsPage />} />
  <Route path="/beneficiaries" element={<BeneficiariesPage />} />
  <Route path="/transactions" element={<TransactionsPage />} />
  <Route path="/reports" element={<ReportsPage />} />
  <Route path="/reports/category-result" element={<CategoryResultReportPage />} />
  <Route path="/reports/funds" element={<FundReportPage />} />
  <Route path="/reports/accountability" element={<AccountabilityReportPage />} />
</Route>
```

---

# Integração com API

HTTP centralizado em:

```text
src/api/http-client.ts
```

```ts
import axios from "axios"

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
})
```

---

# React Query

Usado para:

- loading;
- erro;
- cache;
- refetch;
- mutations;
- sincronização após alterações.

Padrão de hook:

```ts
export function useSomeResource(params: Params) {
  return useQuery({
    queryKey: ["some-resource", params],
    queryFn: () => api.getSomeResource(params),
    enabled: Boolean(params.organizationId),
  })
}
```

Mutations devem invalidar a query principal da feature.

---

# Multi-Tenant Temporário

Enquanto login e organização ativa real não existem, o frontend usa `organizationId` temporário fixo em algumas telas.

Exemplo:

```ts
const TEMP_ORGANIZATION_ID = "..."
```

Isso deve ser removido no futuro.

Fluxo futuro esperado:

```text
login
buscar organizações do usuário
selecionar organização ativa
backend valida tenant pelo JWT
frontend para de enviar organizationId fixo
```

---

# Regras de Negócio Refletidas no Frontend

## Account

Representa dinheiro real.

A tela de contas deve ser tratada como cadastro de locais reais onde existe saldo financeiro.

## Fund

Representa destinação interna/projeto/orçamento.

Não deve ser misturado com Account.

Fundos aparecem em:

- cadastro de fundos;
- alocações;
- relatório de fundos/projetos;
- prestação de contas;
- filtro de transações por fundId.

## Category

Representa classificação financeira.

Categorias podem ser hierárquicas.

O relatório por categoria deve mostrar pai e filhas de forma hierárquica, não como uma tabela CRUD comum.

## Beneficiary

Representa favorecido/destinatário/responsável.

Nem todo beneficiary tem lógica de sustento. Para estagiários, funcionários e fornecedores, o ideal futuro é um relatório próprio de movimentação por beneficiário.

---

# Financial Transactions

## Listagem

A listagem deve suportar filtros via estado e URL.

Filtros importantes:

```text
type
status
source
accountId
categoryId
fundId
description
settlementDateFrom
settlementDateTo
onlyUnclassified
onlyUnallocated
```

## Canceladas

Transações canceladas não devem aparecer por padrão.

Se o usuário escolher status `CANCELED`, então elas aparecem.

## A classificar

Atalho:

```text
/transactions?onlyUnclassified=true
```

Regra visual/funcional:

```text
category == null
status != CANCELED
```

Transações a classificar devem permitir principalmente a ação de classificar, não edição completa nem gestão avançada de alocações.

## A alocar

Atalho:

```text
/transactions?onlyUnallocated=true&status=SETTLED
```

Regra esperada:

```text
status = SETTLED
category != null
type != TRANSFER
não totalmente alocada
```

Transações sem categoria não devem aparecer como “não alocadas”.

## Filtro por fundo

Atalho vindo do relatório de fundos:

```text
/transactions?fundId={fundId}
```

A tela deve ler `fundId` da URL e enviar para a API.

O backend filtra transações que possuem alocações no fundo informado.

---

# Dashboard

Feature:

```text
features/dashboard/
```

Endpoint:

```text
GET /api/v1/dashboard/summary
```

Mostra:

- receitas do período;
- despesas do período;
- resultado;
- saldo em contas;
- saldo em fundos;
- transações a classificar;
- transações a alocar.

Atalhos:

```text
Transações a classificar -> /transactions?onlyUnclassified=true
Transações a alocar -> /transactions?onlyUnallocated=true&status=SETTLED
```

---

# ReportsPage

A `ReportsPage` é uma central de relatórios, não um dashboard.

Visualmente deve parecer uma biblioteca/central:

- área de destaque;
- cards de relatórios;
- badges “Disponível” ou “Em breve”.

Relatórios disponíveis:

```text
Resultado por Categoria
Fundos e Projetos
Prestação de Contas / Sustento
```

Relatórios futuros:

```text
Movimentação por Beneficiário
Fluxo de Caixa / Extrato por Conta
Relatórios por banco/account dentro da prestação
```

---

# Relatório: Resultado por Categoria

Rota:

```text
/reports/category-result
```

Endpoint:

```text
GET /api/v1/reports/category-result
```

Visual esperado:

- cards de receitas, despesas e resultado;
- filtros de período;
- busca por categoria;
- demonstrativo separado em Receitas e Despesas;
- categorias pai com filhas indentadas;
- grupos recolhíveis;
- expandir/recolher tudo.

Não deve parecer uma tabela CRUD.

O frontend recebe itens planos com:

```text
categoryId
categoryName
parentCategoryId
parentCategoryName
type
total
transactionCount
```

E transforma em grupos visuais via utilitário.

---

# Relatório: Fundos e Projetos

Rota:

```text
/reports/funds
```

Endpoint:

```text
GET /api/v1/reports/funds
```

Visual esperado:

- tela com identidade de painel de projetos;
- cards de saldo total, entradas alocadas, saídas alocadas e fundos negativos;
- filtros de período;
- busca por fundo;
- filtro “somente negativos”;
- fundos negativos primeiro;
- cards por fundo/projeto;
- botão “Ver transações deste fundo”.

Campos principais:

```text
fundId
fundName
initialBalance
incomeAllocated
expenseAllocated
periodBalance
currentBalance
allocationCount
```

Conceitos:

```text
periodBalance = incomeAllocated - expenseAllocated
currentBalance = initialBalance + alocações históricas
```

---

# Relatório: Prestação de Contas / Sustento

Rota:

```text
/reports/accountability
```

Endpoint:

```text
GET /api/v1/reports/accountability
```

Objetivo:

```text
Acompanhar valores destinados a favorecidos e quanto já foi repassado ou utilizado por fundo.
```

Visual esperado:

- cards de total destinado, total repassado/utilizado, saldo a repassar e favorecidos com saldo;
- filtros de período;
- busca por favorecido ou fundo;
- filtro “somente saldos a repassar”;
- cards por favorecido/fundo;
- alerta quando ainda existe saldo a repassar;
- alerta quando repasses ultrapassaram valores destinados.

Campos principais:

```text
beneficiaryId
beneficiaryName
fundId
fundName
allocatedAmount
transferredAmount
pendingAmount
allocationCount
```

Regra:

```text
pendingAmount = allocatedAmount - transferredAmount
```

Importante: este relatório não substitui um relatório geral de gastos por beneficiário. Para estagiários, funcionários e fornecedores, criar futuramente “Movimentação por Beneficiário”.

---

# Anexos / Attachments - Próxima Feature

A próxima feature planejada é anexos em transações.

Interface esperada:

Na tela/modal de detalhes da transação:

```text
Dados da transação
Alocações
Anexos
```

Em anexos:

```text
Enviar arquivo
Selecionar tipo: RECEIPT, INVOICE, PROOF_OF_PAYMENT, CONTRACT, OTHER
Listar anexos
Baixar/abrir anexo
Remover anexo
```

Endpoints planejados:

```text
POST   /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/attachments/{attachmentId}/download
DELETE /api/v1/attachments/{attachmentId}
```

---

# Design: Evitar Telas Iguais

Decisão importante: cada relatório deve ter uma identidade visual diferente.

```text
Dashboard -> cards rápidos e atalhos de ação
ReportsPage -> central/biblioteca de relatórios
Resultado por Categoria -> demonstrativo hierárquico, estilo DRE/plano de contas
Fundos e Projetos -> painel de projetos com cards por fundo
Prestação de Contas -> cards por favorecido/fundo, foco humano e saldo a repassar
```

Evitar transformar todos os relatórios em tabelas CRUD.

Tabelas são aceitáveis quando forem demonstrativas, mas relatórios principais devem priorizar escaneabilidade, hierarquia e cards informativos.

---

# Padrões de Código

## Componentes

- componentes globais em `components/`;
- componentes específicos em `features/*/components/`;
- páginas em `pages/`;
- lógica de agrupamento/filtro em utils da feature quando crescer.

## Forms

- schemas em `*-schema.ts`;
- validação com Zod;
- React Hook Form;
- formulários reutilizáveis entre criação e edição.

## Data fetching

- `useQuery` para GET;
- `useMutation` para POST/PUT/DELETE;
- invalidar queries após mutations.

## URL como estado

Quando um filtro vier de atalho/dashboard/relatório, a página deve ler query params com `useSearchParams`.

Exemplos:

```text
/transactions?onlyUnclassified=true
/transactions?onlyUnallocated=true&status=SETTLED
/transactions?fundId=...
```

---

# Próximos Passos Recomendados

1. Implementar attachments em transações.
2. Criar frontend para upload/listagem/download/delete de anexos.
3. Criar fundo padrão / Caixa Base automático.
4. Melhorar prestação com visão por account/banco.
5. Criar relatório Movimentação por Beneficiário.
6. Implementar login JWT.
7. Implementar organização ativa real.
8. Remover `TEMP_ORGANIZATION_ID`.
9. Implementar roles/permissões.
10. Melhorar auditoria e deploy.

---

# Commits Recentes / Convenções

Exemplos:

```text
feat: add reports hub page
feat: add category result report page
feat: integrate category result report page
feat: show category result report as statement
feat: add category search to result report
feat: add expand and collapse controls to category result report
feat: integrate fund report page
feat: add fund report priority controls
feat: filter transactions by fund
feat: integrate accountability report page
refactor: clarify accountability report labels
```
