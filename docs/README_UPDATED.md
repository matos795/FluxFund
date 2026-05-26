# FluxFund API

Sistema SaaS de gestão financeira desenvolvido com **Java 21 + Spring Boot + PostgreSQL + Flyway**.

O FluxFund nasceu para substituir controles financeiros baseados em planilhas e sistemas legados, mantendo as regras reais do negócio, mas com uma arquitetura mais limpa, auditável e preparada para múltiplas organizações.

---

# Objetivo do Sistema

O sistema deve permitir:

- gestão de organizações/empresas;
- usuários vinculados a organizações;
- contas bancárias, caixas físicos e carteiras;
- importação OFX;
- classificação de lançamentos financeiros;
- controle de receitas, despesas e transferências;
- categorias financeiras hierárquicas;
- fundos/projetos/orçamentos internos;
- favorecidos/destinatários/responsáveis;
- alocação parcial de valores em fundos e favorecidos;
- dashboard financeiro;
- relatórios financeiros e prestação de contas;
- anexos como comprovantes, notas fiscais, recibos e contratos;
- autenticação, multi-tenant real, permissões e auditoria.

---

# Stack Tecnológica

## Backend

- Java 21
- Spring Boot
- Spring Data JPA
- Spring Validation
- Spring Security futuramente com JWT
- Flyway
- PostgreSQL
- SpringDoc OpenAPI / Swagger
- Lombok

## Ferramentas

- Git + GitHub
- VS Code / IDE Java
- pgAdmin
- Swagger UI

---

# Conceitos Centrais do Domínio

O FluxFund separa conceitos que não devem ser misturados.

## Account

Representa **dinheiro real**.

Exemplos:

- conta bancária;
- caixa físico;
- carteira;
- conta digital.

O saldo de uma `Account` representa saldo financeiro real. Movimentações entre accounts são transferências, não receita/despesa.

## Fund

Representa uma **destinação interna**, orçamento, projeto ou centro de responsabilidade.

Exemplos:

- Projeto Piauí;
- Projeto Guiné;
- Livraria;
- Pães;
- Caixa Base.

Um `Fund` **não representa conta bancária** e não altera o saldo real de uma account. Ele serve para controle interno, prestação de contas, orçamento e relatórios.

Regra de saldo do fundo:

```text
saldo atual do fund = initialBalance + soma(transaction_allocation.amount)
```

Funds podem ficar positivos ou negativos.

## Category

Representa a natureza/classificação financeira da transação.

Exemplos:

- Oferta destinada;
- Combustível;
- Livraria;
- Repasse missionário;
- Administrativo.

Categorias possuem tipo:

```text
INCOME ou EXPENSE
```

Categorias podem ter hierarquia via `parent_id`, formando um plano de contas.

Regra:

```text
Categoria filha deve ter o mesmo tipo da categoria pai.
```

Essa regra deve ser validada no backend.

## Beneficiary

Representa favorecido, destinatário ou responsável.

Exemplos:

- missionário;
- fornecedor;
- funcionário;
- estagiário;
- responsável por projeto.

`Beneficiary` não deve ser confundido com `Category` nem com `Fund`.

Atenção: nem todo beneficiary tem lógica de “sustento” ou “saldo a repassar”. Um estagiário, fornecedor ou funcionário pode ter apenas despesas vinculadas. Já um missionário pode receber valores destinados e depois repasses.

---

# FinancialTransaction

Representa o lançamento financeiro oficial do sistema.

Pode ser:

- criado manualmente;
- criado a partir de OFX.

O modelo evoluiu para o fluxo atual:

```text
OFX -> FinancialTransaction
```

A origem é indicada por:

```text
FinancialTransactionSource = MANUAL ou OFX
```

No histórico antigo do projeto existia a ideia de `BankTransaction`, mas o fluxo atual simplificado usa `FinancialTransaction` diretamente para itens importados.

## Campos importantes

- account;
- category;
- beneficiary opcional dependendo do fluxo;
- type;
- source;
- status;
- rawDescription;
- description;
- expectedAmount;
- settledAmount;
- interestAmount;
- discountAmount;
- settlementDate;
- importedAt para importações OFX;
- externalId quando vier do banco/OFX.

## rawDescription vs description

Para OFX:

```text
rawDescription = descrição original do banco
```

A `description` é opcional/editável e representa a descrição amigável do usuário.

A tabela e formulários devem priorizar `description` quando existir, mas manter `rawDescription` para auditoria/origem.

---

# TransactionAllocation

Responsável por dividir uma transação oficial entre fundos e favorecidos.

Exemplo:

```text
R$ 1.000 recebidos:
- R$ 700 -> Fund: Projeto Piauí -> Beneficiary: Missionário João
- R$ 300 -> Fund: Livraria -> Beneficiary: NULL
```

Alocação **não altera saldo bancário real**. Ela altera apenas o controle interno de destinação.

## Sinal da alocação

Regra prática:

```text
INCOME  -> allocation.amount positivo
EXPENSE -> allocation.amount negativo
```

Isso permite que fundos e favorecidos tenham saldo calculado por soma.

---

# Tipos de Transação

## INCOME

Receita/entrada financeira.

## EXPENSE

Despesa/saída financeira.

## TRANSFER

Transferência entre accounts.

Transferência não é receita nem despesa e não deve entrar em resultado por categoria, relatórios de receita/despesa ou saldo de fundos.

Exemplo com OFX:

```text
Bradesco: saída de R$ 650
Sicredi: entrada de R$ 650
```

Isso deve ser tratado como transferência entre contas, não como despesa e receita operacional.

---

# Status da Transação

| Status | Significado |
|---|---|
| IMPORTED | Importada via OFX e ainda pendente de classificação/conferência |
| PENDING | Lançamento pendente |
| SETTLED | Lançamento liquidado/pago/recebido |
| CANCELED | Lançamento cancelado logicamente |

## Regra de listagem

Listagens comuns de `FinancialTransaction` **não devem mostrar CANCELED por padrão**.

Regra recomendada:

```text
Se status foi informado: filtrar pelo status informado.
Se status não foi informado: status != CANCELED.
```

Assim ainda é possível consultar canceladas com:

```text
?status=CANCELED
```

---

# Regras Automáticas

## Juros

Se:

```text
settledAmount > expectedAmount
```

A diferença pode ser salva em:

```text
interestAmount
```

## Desconto

Se:

```text
settledAmount < expectedAmount
```

A diferença pode ser salva em:

```text
discountAmount
```

## Liquidação

Se:

```text
settlementDate != null
```

O status tende a ser:

```text
SETTLED
```

Caso contrário:

```text
PENDING
```

## Soft Cancel

O sistema não remove transações financeiras do histórico.

Ao cancelar/deletar:

```text
status = CANCELED
```

Isso preserva auditoria, relatórios históricos e rastreabilidade.

---

# Fluxo de Classificação e Alocação

Uma transação importada ou criada pode precisar de classificação.

## A classificar

Uma transação “a classificar” é aquela sem categoria:

```text
category is null
status != CANCELED
```

Enquanto estiver a classificar, o usuário deve apenas classificá-la. Não deve editar livremente nem gerenciar alocações completas antes de concluir a classificação.

## A alocar / Não alocada

Uma transação “a alocar” deve respeitar esta regra:

```text
status = SETTLED
category is not null
type != TRANSFER
abs(settledAmount) > soma(abs(allocations.amount))
```

Transações sem categoria não devem aparecer como “não alocadas”. Elas pertencem ao fluxo “a classificar”.

---

# Fundo padrão / Caixa Base

Foi identificada uma regra de negócio importante:

Algumas organizações podem querer que tudo que não foi destinado a um fundo específico vá automaticamente para um fundo padrão, como:

```text
Caixa Base
Caixa Geral
Fundo Padrão
```

Essa regra **não deve ser hardcoded**.

Solução futura recomendada:

```text
OrganizationSettings.defaultFundId
```

Regra futura:

```text
Se o usuário classificar/criar uma transação sem alocação explícita
e a organização possuir defaultFundId
então o sistema cria uma alocação automática para o fundo padrão.
```

Isso evita que tudo fique “não alocado”, mas mantém a flexibilidade para organizações com outro modo de administrar.

---

# Compromissos Fixos de Sustento

Foi identificada uma necessidade futura: alguns beneficiários, principalmente missionários, podem ter um valor fixo de sustento que sai do caixa geral/base, independentemente das ofertas destinadas recebidas.

Não colocar esse valor fixo diretamente em `Beneficiary`.

Entidade futura recomendada:

```text
SupportAgreement ou BeneficiaryCommitment
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
```

Esse valor entraria no relatório de sustento como compromisso fixo, mas não como “recebido/destinado por oferta”.

---

# Relatórios Implementados / Planejados

## Dashboard Summary

Endpoint:

```text
GET /api/v1/dashboard/summary
```

Mostra visão rápida:

- receitas do período;
- despesas do período;
- resultado líquido;
- saldo real em accounts;
- saldo interno em funds;
- transações a classificar;
- transações a alocar.

## Resultado por Categoria

Endpoint:

```text
GET /api/v1/reports/category-result
```

Objetivo:

```text
Mostrar receitas, despesas e resultado agrupados pelo plano de contas.
```

O relatório deve respeitar categorias pai e filhas.

Formato visual esperado no frontend:

```text
Receitas
  Categoria Pai
    Categoria Filha

Despesas
  Categoria Pai
    Categoria Filha
```

O backend deve retornar `parentCategoryId` e `parentCategoryName` para permitir agrupamento hierárquico.

## Fundos e Projetos

Endpoint:

```text
GET /api/v1/reports/funds
```

Objetivo:

```text
Mostrar entradas alocadas, saídas alocadas, resultado do período e saldo atual por fundo/projeto.
```

Conceitos:

```text
periodBalance = incomeAllocated - expenseAllocated
currentBalance = initialBalance + soma histórica das alocações
```

A tela deve destacar fundos negativos e permitir ver transações de um fundo.

Filtro por fundo em transações:

```text
GET /api/v1/financial-transactions?fundId=...
```

Esse filtro deve buscar transações que possuem alocações no fundo informado.

## Prestação de Contas / Sustento

Endpoint:

```text
GET /api/v1/reports/accountability
```

Objetivo:

```text
Mostrar valores destinados, repassados/utilizados e saldo a repassar por favorecido e fundo.
```

Regra:

```text
allocatedAmount = soma das alocações positivas
transferredAmount = soma das alocações negativas como valor positivo
pendingAmount = allocatedAmount - transferredAmount
```

Esse relatório é adequado para missionários, ofertas destinadas, projetos com favorecidos e prestação de contas.

Ele não substitui um relatório geral de gastos por beneficiário.

## Relatório futuro: Movimentação por Beneficiário

Necessário para responder:

```text
Quanto a organização gastou/movimentou com cada favorecido no período?
```

Esse relatório serve para:

- estagiários;
- funcionários;
- fornecedores;
- prestadores;
- missionários em visão ampla.

Não deve usar a lógica de “saldo a repassar”.

## Relatório futuro: Prestação por Account/Banco

Foi identificada uma necessidade:

```text
Se um missionário recebeu valores destinados em contas diferentes,
o relatório deve conseguir informar quanto está em cada banco/account.
```

Exemplo:

```text
Missionário João:
Bradesco: R$ 650 a repassar
Sicredi: R$ 500 a repassar
Total: R$ 1.150
```

Isso pode ser calculado via:

```text
TransactionAllocation -> FinancialTransaction -> Account
```

---

# Anexos / Attachments

Arquivos não devem ser salvos diretamente no PostgreSQL.

O banco deve salvar metadados e referência/caminho do arquivo.

Tipos planejados:

```text
RECEIPT
INVOICE
PROOF_OF_PAYMENT
CONTRACT
OTHER
```

Tabela planejada/esperada:

```text
attachment
- id
- organization_id
- financial_transaction_id
- type
- original_filename
- content_type
- size_bytes
- storage_key
- uploaded_at
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

Em desenvolvimento, pode ser usado storage local. Futuramente pode migrar para S3, Cloudflare R2, Supabase Storage ou similar sem mudar a regra de banco.

---

# Arquitetura Multi-Tenant

Todas as entidades principais possuem:

```text
organization_id
```

Isso garante isolamento entre organizações.

Na fase atual, o frontend ainda pode enviar `organizationId` fixo/temporário.

Na implementação real:

```text
Usuário faz login
Backend identifica usuário pelo JWT
Usuário escolhe organização ativa
Backend valida se o usuário pertence à organização
Consultas usam a organização ativa
Frontend remove organizationId fixo
```

---

# API REST - Recursos Principais

## Financial Transactions

```text
POST   /api/v1/financial-transactions
GET    /api/v1/financial-transactions
GET    /api/v1/financial-transactions/{id}
PUT    /api/v1/financial-transactions/{id}
DELETE /api/v1/financial-transactions/{id}
```

Filtros importantes:

```text
organizationId
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

## Dashboard

```text
GET /api/v1/dashboard/summary
```

## Reports

```text
GET /api/v1/reports/category-result
GET /api/v1/reports/funds
GET /api/v1/reports/accountability
```

## Attachments futuro

```text
POST   /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/attachments/{attachmentId}/download
DELETE /api/v1/attachments/{attachmentId}
```

---

# Banco de Dados e Migrations

O projeto utiliza PostgreSQL + Flyway.

Configuração:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

O Hibernate não cria nem altera tabelas automaticamente.

Toda alteração estrutural deve ocorrer via migration Flyway.

Regra:

```text
Migrations antigas não devem ser alteradas após commitadas.
Para mudar estrutura, criar nova migration.
```

---

# Swagger / OpenAPI

Swagger disponível em:

```text
http://localhost:8080/swagger-ui/index.html
```

---

# Próximos Passos Recomendados

Ordem sugerida para chegar em uma implementação real:

1. Implementar attachments em transações.
2. Criar fundo padrão / Caixa Base automático como configuração da organização.
3. Melhorar Prestação de Contas com visão por Account/Banco.
4. Criar compromisso fixo de sustento por beneficiário.
5. Criar relatório de Movimentação por Beneficiário.
6. Implementar login JWT.
7. Implementar organização ativa baseada no usuário logado.
8. Remover `organizationId` fixo do frontend.
9. Implementar roles/permissões.
10. Implementar auditoria básica (`createdBy`, `updatedBy`, `canceledBy`).
11. Fazer deploy inicial e testar com dados reais.

---

# Commits Recentes / Convenções

Exemplos de commits usados no projeto:

```text
feat: add dashboard summary endpoint
feat: integrate category result report page
feat: show category result report as statement
feat: integrate fund report page
feat: add fund report priority controls
feat: add accountability report endpoint
feat: integrate accountability report page
fix: hide canceled financial transactions by default
fix: exclude unclassified transactions from unallocated filter
```
