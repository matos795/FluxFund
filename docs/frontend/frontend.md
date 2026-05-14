# FluxFund Web

Frontend do **FluxFund**, uma aplicação SaaS de gestão financeira desenvolvida com **React**, **TypeScript**, **Vite**, **Tailwind CSS**, **shadcn/ui**, **Axios** e **TanStack React Query**.

Este frontend consome uma API REST desenvolvida em **Java 21 + Spring Boot** e tem como objetivo fornecer uma interface administrativa para gestão financeira de organizações, contas, categorias, fundos, favorecidos, transações, conciliações e relatórios.

---

## Objetivo do frontend

O `fluxfund-web` é responsável por entregar a interface visual e interativa do sistema FluxFund.

Nesta fase inicial, o foco é construir uma base sólida para os CRUDs principais, validando o fluxo completo entre frontend e backend antes de evoluir para autenticação, multi-tenant real, dashboards avançados e relatórios.

A primeira feature implementada foi o CRUD de **Contas**, servindo como padrão para os próximos módulos.

---

## Stack utilizada

### Core

- **React**
- **TypeScript**
- **Vite**

### Estilização e UI

- **Tailwind CSS v4**
- **shadcn/ui**
- **Radix UI**
- **Lucide React**
- **Sonner** para toasts

### Dados e API

- **Axios** para chamadas HTTP
- **TanStack React Query** para cache, loading, mutations e sincronização com a API

### Formulários e validação

- **React Hook Form**
- **Zod**
- **@hookform/resolvers**

---

## Variáveis de ambiente

Na raiz do projeto frontend, crie um arquivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

O prefixo `VITE_` é obrigatório para que o Vite exponha a variável ao frontend.

---

## Scripts principais

```bash
npm install
npm run dev
npm run build
npm run preview
```

O ambiente de desenvolvimento roda em:

```txt
http://localhost:5173
```

---

## Estrutura de pastas

Estrutura base adotada:

```txt
src/
├── api/
│   └── http-client.ts
├── app/
│   └── query-client.ts
├── components/
│   ├── layout/
│   │   ├── app-header.tsx
│   │   ├── app-layout.tsx
│   │   ├── app-sidebar.tsx
│   │   └── page-header.tsx
│   ├── pagination/
│   │   └── page-pagination.tsx
│   └── ui/
│       └── componentes gerados pelo shadcn
├── features/
│   └── accounts/
│       ├── account-labels.ts
│       ├── account-schema.ts
│       ├── accounts-api.ts
│       ├── accounts-mock.ts
│       ├── types.ts
│       ├── components/
│       │   ├── account-actions.tsx
│       │   ├── account-form.tsx
│       │   ├── accounts-table.tsx
│       │   ├── accounts-table-skeleton.tsx
│       │   ├── create-account-dialog.tsx
│       │   └── edit-account-dialog.tsx
│       └── hooks/
│           ├── use-accounts.ts
│           ├── use-create-account.ts
│           ├── use-delete-account.ts
│           └── use-update-account.ts
├── pages/
├── routes/
├── types/
└── utils/
```

---

## Organização por feature

O projeto usa uma abordagem orientada por feature.

Exemplo:

```txt
features/accounts/
```

Tudo que pertence ao domínio de contas fica dentro dessa pasta:

- tipos TypeScript;
- labels de enum;
- schemas de formulário;
- chamadas de API;
- hooks com React Query;
- tabela;
- formulário;
- modais;
- ações da tabela;
- skeleton de carregamento.

Essa abordagem evita que o projeto fique espalhado e facilita replicar o padrão nos próximos CRUDs, como:

```txt
features/categories/
features/funds/
features/beneficiaries/
```

---

## Alias de importação

O projeto usa o alias `@` apontando para `src`.

Exemplo:

```ts
import { Button } from "@/components/ui/button"
import { AccountsTable } from "@/features/accounts/components/accounts-table"
```

Isso evita imports longos como:

```ts
import { Button } from "../../../components/ui/button"
```

Configuração esperada no `vite.config.ts`:

```ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

E no TypeScript:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

---

## Layout principal

O frontend possui um layout administrativo fixo:

```txt
AppLayout
├── AppSidebar
├── AppHeader
└── Outlet
```

O `AppLayout` envolve as páginas principais do sistema. O React Router renderiza a página atual dentro do `Outlet`.

Exemplo:

```tsx
<Route element={<AppLayout />}>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/accounts" element={<AccountsPage />} />
  <Route path="/categories" element={<CategoriesPage />} />
  <Route path="/funds" element={<FundsPage />} />
  <Route path="/beneficiaries" element={<BeneficiariesPage />} />
  <Route path="/transactions" element={<TransactionsPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</Route>
```

---

## Páginas atuais

As páginas iniciais criadas são:

```txt
/
/accounts
/categories
/funds
/beneficiaries
/transactions
/reports
```

A tela de `Accounts` já possui integração completa com o backend.

As demais páginas ainda estão como estrutura visual inicial e serão evoluídas gradualmente.

---

## Integração com API

A integração HTTP é centralizada em:

```txt
src/api/http-client.ts
```

```ts
import axios from "axios"

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
})
```

As features não usam `axios` diretamente. Elas usam o `httpClient`.

Exemplo:

```ts
const response = await httpClient.get("/api/v1/accounts")
```

---

## React Query

O React Query é usado para controlar dados vindos da API.

Ele gerencia:

- loading;
- erro;
- cache;
- refetch;
- mutations;
- sincronização automática após alterações.

A configuração global fica em:

```txt
src/app/query-client.ts
```

```ts
import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
  },
})
```

E é registrada no `main.tsx`:

```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</QueryClientProvider>
```

---

## Diferença entre `useQuery` e `useMutation`

### `useQuery`

Usado para buscar dados.

Exemplo:

```ts
GET /api/v1/accounts
```

Hook:

```ts
useAccounts()
```

### `useMutation`

Usado para alterar dados.

Exemplos:

```txt
POST /api/v1/accounts
PUT /api/v1/accounts/{id}
DELETE /api/v1/accounts/{id}
```

Hooks:

```txt
useCreateAccount
useUpdateAccount
useDeleteAccount
```

Após uma mutation bem-sucedida, a listagem é atualizada usando:

```ts
queryClient.invalidateQueries({
  queryKey: ["accounts"],
})
```

Isso marca os dados de contas como desatualizados e força o React Query a buscar novamente a lista.

---

## Paginação

O backend usa paginação no padrão Spring Data.

A primeira página é `0`.

O frontend possui um tipo genérico para respostas paginadas:

```txt
src/types/page-response.ts
```

A listagem de contas utiliza:

```ts
queryKey: ["accounts", { page, size }]
```

Isso permite que o React Query mantenha cache separado por página.

Exemplo:

```txt
["accounts", { page: 0, size: 10 }]
["accounts", { page: 1, size: 10 }]
```

Componente reutilizável atual:

```txt
src/components/pagination/page-pagination.tsx
```

Ele exibe:

- página atual;
- total de páginas;
- total de registros;
- botão anterior;
- botão próxima.

Recursos como `pageSize`, `sortBy`, `sortDirection`, seleção em massa e filtros avançados foram deixados para uma etapa posterior.

---

## Formulários

Os formulários usam:

- React Hook Form;
- Zod;
- TypeScript;
- componentes do shadcn/ui.

O schema da conta fica em:

```txt
src/features/accounts/account-schema.ts
```

O formulário de conta fica em:

```txt
src/features/accounts/components/account-form.tsx
```

Esse formulário é reutilizado tanto para criação quanto para edição.

### Criação

```tsx
<AccountForm onSubmit={handleCreateAccount} />
```

### Edição

```tsx
<AccountForm
  defaultValues={...}
  submitLabel="Salvar alterações"
  onSubmit={handleUpdateAccount}
/>
```

Isso evita duplicação de código.

---

## Toasts

O projeto usa **Sonner** para feedback visual.

Configuração global:

```tsx
<Toaster richColors position="top-right" />
```

Exemplos de uso:

```ts
toast.success("Conta criada com sucesso.")
toast.error("Não foi possível criar a conta.")
```

Atualmente há feedback para:

- criação de conta;
- edição de conta;
- exclusão/desativação de conta;
- erros de operação.

---

## Skeleton loading

A tela de contas possui skeleton específico:

```txt
src/features/accounts/components/accounts-table-skeleton.tsx
```

Ele representa visualmente a tabela enquanto os dados estão sendo carregados.

Por enquanto o skeleton é específico da feature `accounts`, pois reflete a estrutura da tabela de contas.

No futuro, se outras tabelas repetirem o mesmo padrão, pode ser criado um componente global:

```txt
DataTableSkeleton
```

Regra prática adotada:

```txt
Se repetir 2 ou 3 vezes, abstrair para componente global.
Se for usado uma vez, manter específico da feature.
```

---

## Regras de negócio refletidas no frontend

O frontend respeita os principais conceitos do domínio FluxFund.

### Account

`Account` representa dinheiro real.

Exemplos:

- conta bancária;
- caixa físico;
- carteira;
- conta digital.

A tela de contas deve ser tratada como cadastro de locais reais onde existe saldo financeiro.

### Fund

`Fund` não representa conta bancária.

Ele representa uma destinação interna, projeto, centro de responsabilidade ou orçamento.

Fundos serão tratados em tela própria, sem serem misturados com contas.

### Category

`Category` representa a classificação financeira da movimentação.

Categorias podem ser:

- receita;
- despesa.

Também podem ter hierarquia.

A regra de que uma categoria filha deve possuir o mesmo tipo da categoria pai deve ser respeitada principalmente pelo backend, mas o frontend também deve ajudar o usuário a evitar escolhas inválidas.

### Beneficiary

`Beneficiary` representa o favorecido, destinatário ou responsável.

Exemplos:

- missionário;
- fornecedor;
- funcionário;
- responsável por projeto.

Ele não deve ser confundido com categoria ou fundo.

---

## Delete de Account

No frontend, a ação aparece como **Excluir**.

No domínio financeiro, porém, a recomendação é tratar exclusão como **desativação lógica** quando houver histórico relacionado.

Isso evita quebrar:

- transações antigas;
- relatórios;
- auditoria;
- conciliações;
- saldos históricos.

Fluxo atual:

```txt
Usuário clica em Excluir
→ confirma ação
→ frontend chama DELETE
→ backend decide se remove ou desativa
→ tabela é atualizada
```

No futuro, o sistema pode evoluir para:

```txt
GET /api/v1/accounts?active=true
GET /api/v1/accounts?active=false
PATCH /api/v1/accounts/{id}/activate
PATCH /api/v1/accounts/{id}/deactivate
```

Mas isso não é prioridade nesta fase inicial.

---

## Multi-tenant temporário

Como a autenticação real e o multi-tenant baseado no usuário logado ainda não foram implementados, o frontend utiliza temporariamente um `organizationId` fixo na integração da feature `accounts`.

Exemplo:

```ts
const TEMP_ORGANIZATION_ID = "053453dd-0a51-4650-b8aa-8f17776127eb"
```

Esse valor deve ser removido no futuro, quando houver:

- login real;
- usuário autenticado;
- organização selecionada;
- tenant resolvido pelo backend.

---

## DTOs e payloads

Atualmente o frontend consome um `AccountResponse` completo do backend.

Mesmo que a tabela não exiba todos os campos, isso é aceitável nesta fase porque:

- o objeto ainda é pequeno;
- não há dados sensíveis relevantes;
- evita overengineering;
- acelera a construção dos CRUDs principais.

DTOs mais específicos, como:

```txt
AccountTableResponse
AccountDetailsResponse
AccountFormResponse
```

podem ser considerados no futuro, se houver necessidade de:

- reduzir payload;
- esconder campos;
- melhorar performance;
- separar visualização de edição;
- lidar com entidades muito grandes.

Para entidades mais complexas, como `FinancialTransaction`, DTOs específicos provavelmente farão mais sentido.

---

## O que já foi implementado

### Estrutura inicial

- Setup com Vite + React + TypeScript
- Tailwind CSS v4
- shadcn/ui com Radix
- Alias `@`
- Layout principal
- Sidebar
- Header
- Rotas principais
- Páginas iniciais

### Feature Accounts

- Listagem real via backend
- Criação via API
- Edição via API
- Exclusão/desativação via API
- Toasts de sucesso e erro
- Paginação simples
- Loading skeleton
- Formulário reutilizável
- Validação com Zod
- Integração com React Query
- Integração com Axios

---

## Padrão para novos CRUDs

Os próximos CRUDs devem seguir o padrão da feature `accounts`.

Para cada nova feature:

```txt
features/nome-da-feature/
├── nome-api.ts
├── nome-labels.ts
├── nome-schema.ts
├── types.ts
├── components/
│   ├── nome-table.tsx
│   ├── nome-table-skeleton.tsx
│   ├── nome-form.tsx
│   ├── create-nome-dialog.tsx
│   ├── edit-nome-dialog.tsx
│   └── nome-actions.tsx
└── hooks/
    ├── use-nomes.ts
    ├── use-create-nome.ts
    ├── use-update-nome.ts
    └── use-delete-nome.ts
```

---

## Próximos passos recomendados

Ordem recomendada:

```txt
1. CRUD de Category
2. CRUD de Fund
3. CRUD de Beneficiary
4. Melhorar filtros simples
5. Adicionar sort e pageSize
6. Melhorar seleção e ações em massa, se necessário
7. Iniciar FinancialTransaction
8. Iniciar TransactionAllocation
9. Iniciar BankTransaction/OFX
10. Autenticação real com JWT
11. Multi-tenant baseado no usuário logado
12. Dashboard e relatórios reais
```

---

## O que deixar para depois

Nesta fase, não é prioridade implementar:

- filtros avançados;
- ordenação complexa;
- seleção em massa;
- DTOs excessivamente específicos;
- permissões por role;
- login real;
- reativação de contas inativas;
- upload de anexos;
- dashboards com métricas reais;
- relatórios avançados.

Essas funcionalidades devem ser adicionadas depois que os CRUDs base estiverem funcionando bem.

---

## Convenções atuais

### Commits

Exemplos usados:

```txt
chore: setup initial frontend routing structure
feat: add initial app layout and pages
feat: add accounts table with mock data
feat: integrate accounts page with backend API
feat: create accounts through backend API
feat: delete accounts through backend API
feat: edit accounts through backend API
feat: add toast feedback to account actions
feat: add accounts pagination
feat: add loading skeleton to accounts table
```

### Componentes

- Componentes globais ficam em `components/`.
- Componentes específicos ficam dentro da feature.
- Componentes de UI gerados pelo shadcn ficam em `components/ui/`.

### Dados

- Chamadas HTTP ficam em `*-api.ts`.
- Busca de dados usa `useQuery`.
- Alteração de dados usa `useMutation`.
- Após mutations, invalidar a query principal da feature.

### Formulários

- Schemas ficam em `*-schema.ts`.
- Validação deve ser feita com Zod.
- Formulários devem ser reutilizáveis entre criação e edição sempre que possível.

---

## Observação final

O frontend do FluxFund deve evoluir de forma incremental.

A prioridade atual é criar um sistema funcional, consistente e fácil de manter, sem antecipar complexidades que ainda não são necessárias.

A feature `Account` serve como base de aprendizado e padrão arquitetural para os próximos módulos do sistema.
