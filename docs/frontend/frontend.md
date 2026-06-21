# FluxFund Web

Frontend do FluxFund, uma aplicação de gestão financeira e prestação de contas construída com React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Axios, TanStack Query, React Hook Form e Zod.

> Documento atualizado em **20/06/2026**. O frontend já suporta piloto interno com sessão autenticada, organização ativa, operações financeiras, auditoria e relatórios.

---

# Objetivo do Frontend

A interface deve transformar rotinas financeiras repetitivas em um fluxo claro, seguro e rápido:

```text
importar
→ conferir/classificar
→ alocar
→ anexar documentos
→ acompanhar pendências
→ gerar relatórios e exportações
```

A prioridade é operação diária, rastreabilidade e prestação de contas — não apenas dashboards.

---

# Estado atual

| Feature / página | Estado | Observação |
|---|---|---|
| Login e logout | Implementado | Sessão com JWT e rotas protegidas. |
| Organização ativa | Implementado | Troca de organização no header e contexto de tenant nas requisições. |
| Roles/permissões | Implementado | Ações e rotas respeitam `OWNER`, `ADMIN`, `FINANCE` e `VIEWER`. |
| Layout | Implementado | Sidebar recolhível, header persistente e rotas administrativas. |
| Accounts | Implementado | CRUD de contas reais, incluindo cartão de crédito. |
| Categories | Implementado | CRUD, hierarquia e configuração de documentação. |
| Funds | Implementado | CRUD, regras de saldo e relatórios. |
| Beneficiaries | Implementado | CRUD e integração com alocações/compromissos. |
| Financial Transactions | Implementado | Tabela operacional, filtros, edição, cancelamento e exportação. |
| OFX / CSV | Implementado | Importações e fluxo de classificação posterior. |
| Classificação | Implementado | Modal de classificação com anexos, alocações e sugestões. |
| Sugestão automática | Implementado | Preenche formulário por histórico compatível quando habilitada. |
| Compromisso ativo | Implementado | Sugere fundo e valor ao selecionar beneficiário elegível. |
| Attachments | Implementado | Upload, download, exclusão e indicadores documentais. |
| Cartão de crédito | Implementado | Faturas, itens, importação e pagamento. |
| Transferências | Implementado | Criação, classificação e cancelamento de transferências entre contas. |
| Settings | Implementado | Fundo padrão, regras de documentação e sugestões automáticas. |
| Dashboard | Implementado | Métricas, gráficos e atalhos de pendência. |
| Relatórios | Implementado | Categoria, fundos, prestação, fluxo de caixa por conta e auditoria. |
| Auditoria | Implementado | Tela administrativa com filtros e paginação. |
| Excel | Implementado | Prestação/sustento e movimento financeiro liquidado. |

---

# Stack

## Core

- React
- TypeScript
- Vite

## UI

- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- Sonner

## Dados e formulários

- Axios por meio do `httpClient`
- TanStack React Query
- React Hook Form
- Zod
- `@hookform/resolvers`

---

# Variáveis de ambiente

Arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Em produção, esse valor deve apontar para a API publicada.

---

# Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

---

# Organização por feature

Estrutura de referência:

```text
src/
├── api/
│   └── http-client.ts
├── app/
│   └── query-client.ts
├── components/
│   ├── form/
│   ├── layout/
│   ├── pagination/
│   └── ui/
├── features/
│   ├── accounts/
│   ├── audit-logs/
│   ├── auth/
│   ├── beneficiaries/
│   ├── categories/
│   ├── credit-card-statements/
│   ├── dashboard/
│   ├── financial-transactions/
│   ├── funds/
│   ├── organization-settings/
│   ├── reports/
│   ├── support-agreements/
│   └── users/
├── pages/
├── routes/
├── types/
└── utils/
```

Padrão recomendado por feature:

```text
feature/
├── feature-api.ts
├── feature-types.ts
├── feature-labels.ts
├── feature-schema.ts
├── hooks/
└── components/
```

Evitar Axios diretamente nos componentes. Toda integração deve usar `httpClient`.

---

# Sessão, tenant e permissões

## Requisições

O cliente HTTP deve incluir:

```text
Authorization: Bearer <token>
X-Organization-Id: <organização ativa>
```

Ao trocar a organização ativa:

```text
trocar contexto
→ invalidar queries dependentes da organização
→ recarregar dados da organização nova
```

## Permissões

O backend é a fonte final de autorização. O frontend deve esconder ou desabilitar ações sem permissão para melhorar UX, mas nunca substituir a validação do backend.

Matriz prática:

| Operação | OWNER | ADMIN | FINANCE | VIEWER |
|---|---:|---:|---:|---:|
| Visualizar dashboard/relatórios | Sim | Sim | Sim | Sim |
| Exportar | Sim | Sim | Sim | Conforme política |
| Criar/classificar transações | Sim | Sim | Sim | Não |
| Gerenciar anexos/alocações | Sim | Sim | Sim | Não |
| Gerenciar configurações | Sim | Sim | Não | Não |
| Consultar auditoria | Sim | Sim | Não | Não |
| Gerenciar usuários | Sim | Sim | Não | Não |

---

# Tela operacional de transações

Rota:

```text
/transactions
```

A tabela é o ambiente de trabalho principal.

## Colunas prioritárias

```text
Situação | Data | Tipo | Descrição | Conta | Categoria | Valor | Alocação | Docs | Ações
```

## Regras visuais

- exibir `description` quando preenchida;
- preservar `rawDescription` como contexto/origem bancária;
- não exibir canceladas por padrão;
- usar badges para status, tipo e alocação;
- sinalizar documentação financeira;
- clique na linha abre Classificar para pendente e Detalhes para transação já classificada;
- clique no menu de ações não dispara abertura da linha.

## Pendências

```text
A classificar:
category == null
AND status != CANCELED

A alocar:
SETTLED
AND category preenchida
AND não é transferência
AND ainda há saldo a alocar
```

---

# Classificar

A classificação deve reduzir trabalho repetitivo sem esconder decisão financeira.

## Formulário

```text
tipo
categoria
descrição editável
anexos
alocações por fundo/favorecido
mês de referência
```

## Anexo pendente

```text
Sem arquivo selecionado -> pode salvar.
Arquivo enviado -> pode salvar.
Arquivo selecionado e não enviado -> bloquear salvar e avisar.
```

## Sugestão automática por histórico

Quando `autoFillClassificationSuggestions` estiver habilitada:

```text
Abrir modal Classificar
→ chamar classification-suggestion
→ preencher tipo, categoria, descrição e alocações
→ mostrar aviso para revisão
→ usuário salva manualmente
```

Nada é classificado apenas por abrir o modal.

### Limite conhecido

Quando a mesma chave de histórico é usada em operações diferentes, como sustento e reembolso, a sugestão pode ser ambígua. A evolução futura deve evitar preenchimento automático quando o histórico for conflitante.

## Sugestão por compromisso

Ao selecionar beneficiário em alocação de despesa:

```text
Se houver um único SupportAgreement ativo aplicável
→ sugerir fund, beneficiary, referenceMonth e amount.
```

A sugestão pode estar configurada para preencher automaticamente, mas o salvamento continua manual.

---

# Anexos e documentação

Tipos atuais:

```text
RECEIPT
INVOICE
PROOF_OF_PAYMENT
CONTRACT
OTHER
```

O frontend deve invalidar as queries corretas após upload/delete:

```text
["transaction-attachments", transactionId]
["financial-transactions"]
```

A tabela de transações depende dos contadores de anexos para exibir o estado documental.

---

# Cartão de crédito

A feature de cartão usa fluxo próprio:

```text
Fatura
→ itens
→ classificação/anexos dos itens
→ pagamento da fatura por conta não-cartão
```

A UI não deve tratar o pagamento como uma nova despesa operacional duplicada.

---

# Relatórios atuais

| Rota | Finalidade |
|---|---|
| `/reports/category-result` | Resultado por categoria e hierarquia. |
| `/reports/funds` | Saldos e movimentação de fundos/projetos. |
| `/reports/accountability` | Prestação/sustento por beneficiário, fundo e conta. |
| `/reports/cash-flow` | Fluxo de caixa por conta, período e saldo acumulado. |
| `/reports/audit-logs` | Histórico administrativo de ações críticas. |

A central `/reports` deve continuar sendo o ponto de entrada para relatórios, não o dashboard.

---

# Auditoria

Rota:

```text
/reports/audit-logs
```

A tela deve ter:

```text
filtros por ação
filtros por entidade
filtros por período
paginação
usuário responsável
descrição legível da ação
```

A página deve ser restrita a `OWNER` e `ADMIN`.

---

# Próxima feature planejada — Dossiê de Fechamento

## Produto

```text
Relatórios -> Dossiê de Fechamento
```

A tela deverá permitir gerar uma pasta digital/impressa por período, com extratos bancários e documentos de cada transação.

## Configurações iniciais da UI

```text
Período
Contas selecionadas
Incluir contas sem movimento
Incluir receitas
Incluir despesas
Incluir transferências
Ordenação
Modelo de geração
```

Padrão recomendado:

```text
Todas as contas selecionadas
→ conta
→ data
→ despesa
→ comprovante
→ documento fiscal
→ outros anexos
```

## Prévia de pendências

Antes de gerar:

```text
Bradesco
- Extrato PDF: OK/Faltando
- Transações: 42
- Despesas sem comprovante: 3
- Despesas sem documento fiscal: 2
```

O usuário poderá corrigir ou escolher gerar mesmo assim, com avisos claros.

## UX futura

A feature precisa atender processos diferentes. Não fixar o comportamento de uma única empresa.

Opções previstas:

```text
Incluir capa por conta
Incluir contas sem movimento
Exigir extrato bancário
Exigir comprovante
Exigir documento fiscal
Agrupar por data/categoria/favorecido
Incluir termo de conferência e assinatura
```

---

# Padrões de qualidade

Antes de commit:

```bash
npm run lint
npm run build
```

Para cada nova mutation, verificar se as query keys relacionadas são invalidadas.

Para modais com preenchimento automático, evitar `setState` síncrono direto em efeitos quando a regra de lint do projeto bloquear; agendar a aplicação ou estruturar a atualização de forma que não gere renderizações em cascata.

---

# Roadmap

## Agora

- piloto interno com dados reais;
- correção de bugs encontrados no uso;
- evitar grandes mudanças sem uma dor confirmada;
- manter backups e validar a versão publicada.

## Próximo bloco

- tela e fluxo do Dossiê de Fechamento;
- upload de extrato bancário PDF por conta/período;
- prévia de pendências;
- PDF final com transações e anexos.

## Depois

- tratar sugestões históricas conflitantes;
- aperfeiçoar chaves de sugestão;
- testes automatizados críticos;
- exportações adicionais;
- melhoria de onboarding e administração de usuários.

## Preparação para venda

- recuperação de senha;
- onboarding;
- política de privacidade;
- configurações de marca por organização;
- backups automatizados;
- storage externo seguro;
- monitoramento;
- termos de serviço e suporte.
