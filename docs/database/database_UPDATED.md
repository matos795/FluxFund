# Database Architecture - FluxFund

Banco de dados PostgreSQL versionado com Flyway.

O modelo foi desenhado para suportar:

- SaaS multi-tenant;
- contas reais;
- fundos/destinações internas;
- categorias hierárquicas;
- favorecidos/destinatários;
- transações financeiras oficiais;
- alocações por fundo/favorecido;
- importação OFX;
- relatórios financeiros;
- anexos financeiros;
- futura autenticação, auditoria e permissões.

---

# Multi-Tenant

Todas as tabelas principais devem possuir:

```text
organization_id
```

Isso garante isolamento entre organizações.

Na fase atual, o frontend ainda pode enviar `organizationId` fixo. Futuramente, a organização deve vir do usuário autenticado e da organização ativa.

---

# Entidades Principais

## organization

Representa uma empresa/organização dentro da plataforma.

Futura configuração recomendada:

```text
default_fund_id
```

ou uma tabela separada:

```text
organization_settings
```

para armazenar o fundo padrão/Caixa Base.

## app_user

Usuário do sistema.

Ainda será usado na fase de login real.

## organization_user

Relaciona usuários e organizações.

Permite:

- múltiplos usuários por organização;
- um usuário em múltiplas organizações;
- roles/permissões por organização.

---

# Estrutura Financeira

## account

Representa dinheiro real.

Exemplos:

- conta bancária;
- caixa físico;
- carteira;
- conta digital.

`Account` é onde o dinheiro existe fisicamente/financeiramente.

`Fund` não é account.

## category

Classificação financeira.

Exemplos:

- oferta destinada;
- combustível;
- repasse missionário;
- administrativo;
- livraria.

Categorias podem ter hierarquia:

```text
parent_id
```

Regra:

```text
Categoria filha deve ter o mesmo tipo da categoria pai.
```

O relatório por categoria depende de:

```text
category.id
category.name
category.parent_id
category.type
```

para montar a estrutura pai/filha.

## fund

Representa destinação interna/orçamento/projeto.

Exemplos:

- Projeto Piauí;
- Projeto Guiné;
- Livraria;
- Caixa Base.

Fundos são usados para:

- alocação financeira;
- relatórios internos;
- prestação de contas;
- controle de saldos por projeto.

Regra de saldo:

```text
currentBalance = initialBalance + soma(transaction_allocation.amount)
```

Funds podem ficar negativos.

## beneficiary

Representa favorecido, destinatário ou responsável.

Exemplos:

- missionário;
- fornecedor;
- funcionário;
- estagiário;
- responsável de projeto.

Atenção: `beneficiary` não deve guardar diretamente valor fixo de sustento. Para isso, criar uma entidade futura de compromisso.

---

# Transações

## financial_transaction

Representa o lançamento financeiro oficial.

Pode ser:

- manual;
- importado de OFX.

Fluxo atual:

```text
OFX -> financial_transaction
```

A origem deve ser armazenada em:

```text
source = MANUAL ou OFX
```

Campos importantes:

```text
id
organization_id
account_id
category_id
type
source
status
external_id
raw_description
description
expected_amount
settled_amount
interest_amount
discount_amount
settlement_date
imported_at
created_at
updated_at
```

## Sobre bank_transaction

Em versões/concepções antigas havia o fluxo:

```text
OFX -> bank_transaction -> financial_transaction
```

O domínio evoluiu para:

```text
OFX -> financial_transaction
```

Se a tabela `bank_transaction` existir em migrations antigas, tratá-la como legado/depreciação até decisão futura. Não reintroduzir esse fluxo sem necessidade clara.

---

# transaction_allocation

Responsável por dividir valores entre fundos e favorecidos.

Campos principais:

```text
id
organization_id
financial_transaction_id
fund_id
beneficiary_id
amount
created_at
updated_at
```

Regra de sinal:

```text
INCOME  -> amount positivo
EXPENSE -> amount negativo
```

Exemplo:

| Fundo | Favorecido | Valor |
|---|---|---:|
| Projeto Piauí | Missionário João | 700 |
| Livraria | NULL | 300 |

Em uma despesa/repasse:

| Fundo | Favorecido | Valor |
|---|---|---:|
| Projeto Piauí | Missionário João | -500 |

---

# Regras Derivadas de Consulta

## Transações a classificar

```text
financial_transaction.category_id is null
financial_transaction.status != CANCELED
```

## Transações a alocar

```text
financial_transaction.status = SETTLED
financial_transaction.category_id is not null
financial_transaction.type != TRANSFER
abs(financial_transaction.settled_amount) > soma(abs(transaction_allocation.amount))
```

## Listagem padrão de transações

Se nenhum status for informado:

```text
status != CANCELED
```

Se status for informado:

```text
status = status informado
```

## Filtro por fundId em transações

A listagem de transações pode filtrar por fundo usando subquery em `transaction_allocation`:

```text
financial_transaction.id in (
  select financial_transaction_id
  from transaction_allocation
  where fund_id = :fundId
  and organization_id = :organizationId
)
```

---

# Transferências

Transferências entre contas reais devem ser `FinancialTransactionType.TRANSFER`.

Elas representam movimentação entre accounts, não receita/despesa.

Exemplo OFX:

```text
Bradesco: saída de R$ 650
Sicredi: entrada de R$ 650
```

Essas duas pontas devem futuramente ser conciliadas como uma transferência.

Transferências não devem afetar:

- resultado por categoria;
- receitas/despesas;
- saldo de fundos;
- prestação de contas.

---

# Relatórios e Dados Necessários

## Dashboard Summary

Usa:

- financial_transaction;
- transaction_allocation;
- account;
- fund.

Calcula:

```text
incomeTotal
expenseTotal
netTotal
accountsTotalBalance
fundsTotalBalance
unclassifiedCount
unallocatedCount
```

## Category Result Report

Endpoint:

```text
/api/v1/reports/category-result
```

Necessita retornar:

```text
categoryId
categoryName
parentCategoryId
parentCategoryName
type
total
transactionCount
```

Usa `left join` com categoria pai.

## Fund Report

Endpoint:

```text
/api/v1/reports/funds
```

Calcula por fund:

```text
initialBalance
incomeAllocated
expenseAllocated
periodBalance
currentBalance
allocationCount
```

Regras:

```text
periodBalance = incomeAllocated - expenseAllocated
currentBalance = initialBalance + soma histórica das alocações
```

## Accountability / Sustento Report

Endpoint:

```text
/api/v1/reports/accountability
```

Agrupa por:

```text
beneficiary + fund
```

Calcula:

```text
allocatedAmount = soma(amount > 0)
transferredAmount = soma(abs(amount < 0))
pendingAmount = allocatedAmount - transferredAmount
```

Esse relatório serve para prestação de contas/sustento, não para gastos gerais por beneficiário.

---

# Futuro: Movimentação por Beneficiário

Criar relatório separado para:

```text
Quanto foi movimentado/gasto por beneficiário no período?
```

Esse relatório deve atender casos como:

- estagiário;
- funcionário;
- fornecedor;
- prestador.

Não deve usar a lógica de saldo a repassar.

---

# Futuro: Compromissos Fixos de Sustento

Não armazenar valor fixo mensal diretamente em `beneficiary`.

Criar entidade futura:

```text
support_agreement
```

ou:

```text
beneficiary_commitment
```

Campos prováveis:

```text
id
organization_id
beneficiary_id
fund_id
amount
start_date
end_date
active
description
created_at
updated_at
```

Esse valor será usado em relatórios de sustento como compromisso fixo, mas não como valor recebido/destinado por oferta.

---

# Futuro: Fundo Padrão / Caixa Base

Algumas organizações precisam que o valor não destinado explicitamente vá para um fundo padrão.

Solução recomendada:

```text
organization_settings.default_fund_id
```

Regra:

```text
Se transação for classificada/criada sem alocação explícita
e organização tiver defaultFundId
criar transaction_allocation automática para esse fund.
```

Não hardcodar “Caixa Base”. Deve ser configuração da organização.

---

# Attachments

## attachment

Armazena metadados e referência de arquivos relacionados a transações financeiras.

O arquivo em si não deve ser salvo no PostgreSQL.

Campos recomendados:

```text
id
organization_id
financial_transaction_id
type
original_filename
content_type
size_bytes
storage_key
uploaded_at
created_at
updated_at
```

Tipos:

```text
RECEIPT
INVOICE
PROOF_OF_PAYMENT
CONTRACT
OTHER
```

Exemplo de storage key:

```text
organizations/{organizationId}/transactions/{transactionId}/comprovante.pdf
```

Endpoints planejados:

```text
POST   /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/attachments/{attachmentId}/download
DELETE /api/v1/attachments/{attachmentId}
```

Durante desenvolvimento, pode usar storage local. Depois, migrar para S3/R2/Supabase Storage mantendo `storage_key`.

---

# Auditoria Futura

Para produção real, adicionar campos como:

```text
created_by
updated_by
canceled_by
canceled_at
```

Especialmente em:

- financial_transaction;
- transaction_allocation;
- attachment;
- fund;
- category;
- beneficiary.

---

# Estratégia de Migrations

O projeto usa Flyway.

Configuração:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

O Hibernate não deve criar/alterar tabelas automaticamente.

Regra:

```text
Nunca alterar migration antiga já commitada.
Criar nova migration para qualquer mudança estrutural.
```

Exemplos:

```text
V1__create_initial_tables.sql
V2__create_financial_core_tables.sql
V3__create_beneficiary_table.sql
V4__create_transaction_tables.sql
V10__remove_issue_date_from_financial_transaction.sql
Vxx__create_attachment_table.sql
```

---

# Próximos Passos de Banco

1. Criar/validar tabela `attachment`.
2. Avaliar `organization_settings` com `default_fund_id`.
3. Criar entidade/tabela futura para compromissos fixos de sustento.
4. Planejar auditoria (`created_by`, `updated_by`, etc.).
5. Planejar autenticação e tenant real baseado no usuário.
