# Database Architecture — FluxFund

Banco PostgreSQL versionado com Flyway para o FluxFund.

> Documento atualizado em **20/06/2026**. O banco já suporta operação piloto multi-tenant com autenticação, auditoria, importações, cartão de crédito, transferências e relatórios. A próxima evolução relevante é o Dossiê de Fechamento.

---

# Princípios do modelo

O banco deve preservar quatro responsabilidades distintas:

```text
Account = dinheiro real.
Fund = destinação/orçamento interno.
Category = natureza financeira.
Beneficiary = favorecido/destinatário.
```

Toda entidade pertencente a um cliente deve ter `organization_id` ou ser alcançável apenas através de uma entidade validada da organização.

```text
Tenant isolation is enforced by backend authorization;
the frontend header alone is never sufficient.
```

---

# Estado das entidades

| Tabela / entidade | Estado | Finalidade |
|---|---|---|
| `organization` | Implementada | Tenant/empresa. |
| `app_user` | Implementada | Usuário autenticado. |
| `organization_user` | Implementada | Vínculo usuário-organização e role. |
| `account` | Implementada | Contas reais, caixas, carteiras, contas digitais e cartões. |
| `category` | Implementada | Plano de contas hierárquico. |
| `fund` | Implementada | Destinação interna/projeto/orçamento. |
| `beneficiary` | Implementada | Favorecido/destinatário. |
| `financial_transaction` | Implementada | Lançamento financeiro oficial. |
| `transaction_allocation` | Implementada | Distribuição de transação em fundos/favorecidos. |
| `attachment` | Implementada | Metadados e chave de storage de documentos. |
| `organization_settings` | Implementada | Configurações financeiras e de automação por organização. |
| `support_agreement` | Implementada | Compromisso mensal por beneficiário/fundo. |
| `credit_card_statement` | Implementada | Fatura de cartão. |
| `credit_card_statement_item` | Implementada | Item de fatura e sua classificação/documentação. |
| `audit_log` | Implementada | Histórico de ações críticas. |
| `bank_statement_document` | Planejada | Extrato PDF oficial por conta e período, para Dossiê de Fechamento. |

---

# Segurança, tenant e roles

Fluxo:

```text
login
→ JWT identifica app_user
→ request informa organização ativa
→ backend valida organization_user
→ role autoriza a operação
→ consulta sempre é restringida ao tenant
```

Roles atuais:

```text
OWNER
ADMIN
FINANCE
VIEWER
```

---

# account

Representa dinheiro real.

Campos relevantes:

```text
id
organization_id
name
type
initial_balance
initial_balance_date
active
created_at
updated_at
```

Tipos incluem:

```text
BANK_ACCOUNT
CASH
DIGITAL_WALLET
CREDIT_CARD
OTHER
```

Regras:

- `Fund` nunca substitui `Account`;
- transferência entre accounts não entra no resultado operacional;
- `CREDIT_CARD` possui fluxo de fatura específico;
- importação OFX bancária comum não deve ser direcionada a account do tipo cartão.

---

# financial_transaction

Lançamento financeiro oficial.

Campos relevantes:

```text
id
organization_id
account_id
category_id
type
source
status
external_id
description
raw_description
due_date
settlement_date
expected_amount
settled_amount
interest_amount
discount_amount
document_number
imported_at
classified_at
created_at
updated_at
```

## Tipos

```text
INCOME
EXPENSE
TRANSFER
```

## Status

```text
PENDING
SETTLED
CANCELED
```

## Regras

```text
category_id is null
→ a classificar

status = SETTLED
AND category_id is not null
AND type != TRANSFER
AND saldo ainda não distribuído
→ a alocar
```

Cancelamento é lógico:

```text
DELETE/cancelamento
→ status = CANCELED
```

Transações canceladas permanecem auditáveis e não devem aparecer em listagens comuns sem filtro explícito.

---

# Importação e deduplicação

## OFX

O fluxo atual é:

```text
OFX -> financial_transaction
```

O identificador externo do banco deve ser preservado em `external_id`.

Integridade esperada para impedir reimportação:

```text
UNIQUE (organization_id, account_id, external_id)
```

Isso deve proteger casos de períodos sobrepostos:

```text
OFX Maio
→ importa lançamentos de Maio

OFX Maio + Junho
→ ignora os FITIDs já existentes de Maio
→ importa apenas os novos de Junho
```

## Recomendações

- registrar auditoria resumida por arquivo de importação;
- validar explicitamente arquivos OFX com múltiplos extratos;
- não depender apenas de data/valor/descrição quando há FITID;
- preservar `raw_description` original em todos os casos.

---

# Sugestão de classificação

A sugestão é derivada de histórico; não altera a integridade da transação até o usuário salvar.

## Configuração

`organization_settings` contém:

```text
auto_fill_classification_suggestions
```

## Chave de sugestão

A comparação usa versão normalizada de `raw_description`, sem modificar o conteúdo original.

Exemplo:

```text
raw_description:
PIX RECEBIDO REM: PRIMEIRA IGREJA BATIS 25/05

suggestion key:
PIX RECEBIDO REM: PRIMEIRA IGREJA BATIS
```

A normalização deve remover data somente ao final da frase. Evitar remover números internos que podem representar parcela, NF, contrato ou identificador.

## Evolução recomendada

A versão atual pode consultar candidatos e comparar a chave em código. Para crescimento de volume, persistir uma coluna:

```text
suggestion_key
```

Índice recomendado:

```text
(organization_id, account_id, suggestion_key, settlement_date desc)
```

Benefícios:

- busca rápida;
- isolamento por conta;
- não depender de uma janela fixa de transações recentes;
- melhor base para analisar consistência histórica.

## Histórico conflitante

Exemplo:

```text
PIX ALEX -> Sustento
PIX ALEX -> Reembolso
```

Não deve haver autoaplicação cega quando histórico equivalente estiver conflitante.

Evolução:

```text
histórico consistente
→ auto preencher

histórico conflitante
→ devolver opções; exigir escolha do usuário
```

---

# transaction_allocation

Divide a transação por fundo e beneficiário.

Campos:

```text
id
organization_id
financial_transaction_id
fund_id
beneficiary_id
amount
reference_month
created_at
updated_at
```

Sinal:

```text
INCOME  -> amount positivo
EXPENSE -> amount negativo
TRANSFER -> não gera alocação operacional normal
```

Saldo de fund:

```text
initial_balance + SUM(transaction_allocation.amount)
```

---

# support_agreement

Representa compromisso fixo mensal.

Campos:

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

Cálculo em relatório:

```text
commitmentAmount  = valor mensal aplicável no período
allocatedAmount   = recursos destinados
transferredAmount = repasses
pendingAmount     = commitmentAmount + allocatedAmount - transferredAmount
```

Regra de integridade:

```text
não permitir duplicidade ativa para:
organization_id + beneficiary_id + fund_id
```

A validação deve existir em create, update e activate. Quando possível, reforçar no banco com índice único parcial para registros `active = true`.

---

# attachment

Armazena somente metadados e referência do arquivo. O binário não deve ser persistido no PostgreSQL.

Campos:

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
uploaded_by
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

Indicadores operacionais por transação:

```text
attachment_count
payment_proof_attachment_count
fiscal_attachment_count
```

Esses indicadores auxiliam tabela, exportações e futura validação do Dossiê de Fechamento.

---

# Cartão de crédito

## credit_card_statement

Campos conceituais:

```text
id
organization_id
account_id
name
closing_date
due_date
status
total_amount
paid_amount
created_at
updated_at
```

## credit_card_statement_item

Representa item individual de fatura, com classificação, favorecido e documentos quando necessário.

Regra de domínio:

```text
Pagamento da fatura
≠ nova despesa operacional duplicada

Itens da fatura
= despesas/documentos que precisam ser classificados
```

---

# Transferências entre accounts

Transferência é `FinancialTransactionType.TRANSFER`.

Não deve afetar:

```text
resultado por categoria
receitas/despesas operacionais
saldo de fund
prestação de sustento
```

O banco deve manter o vínculo entre as duas pontas da transferência conforme o modelo atual de transfer fields.

---

# audit_log

Registra a trilha completa de ações críticas.

Campos conceituais:

```text
id
organization_id
actor_user_id
entity_type
entity_id
action
description
created_at
```

Entidades prioritárias:

```text
FINANCIAL_TRANSACTION
TRANSACTION_ALLOCATION
ATTACHMENT
SUPPORT_AGREEMENT
ORGANIZATION_SETTINGS
OFX_IMPORT
TRANSFER
CREDIT_CARD_STATEMENT
```

Para importação, preferir um registro resumido ao final:

```text
Arquivo X importado
Conta Y
120 importadas
80 duplicadas
2 falhas
```

Evitar um log quase idêntico para cada item importado.

---

# Campos diretos de auditoria

Além de `audit_log`, entidades críticas podem manter:

```text
created_by
updated_by
canceled_by
canceled_at
uploaded_by
activated_by
deactivated_by
```

Uso:

```text
Campos diretos = resposta rápida de “quem fez por último”.
audit_log = sequência completa de eventos.
```

Esses campos devem ser mapeados e preenchidos de maneira consistente antes de uma operação SaaS maior.

---

# Próxima evolução de banco — Dossiê de Fechamento

## Necessidade

OFX fornece movimentos, mas não substitui o extrato oficial do banco em PDF. Para conferência, auditoria interna ou fechamento impresso/digital, o sistema precisa relacionar o extrato bancário oficial com as transações e documentos daquele período.

## Entidade planejada: bank_statement_document

Modelo inicial:

```text
id
organization_id
account_id
period_start_date
period_end_date
original_filename
content_type
size_bytes
storage_key
uploaded_at
uploaded_by
created_at
updated_at
```

Regras:

- pertence a uma organização e account;
- deve aceitar PDF no MVP;
- pode haver mais de um arquivo por conta/período, se necessário;
- não armazena binário no PostgreSQL;
- deve integrar com o mesmo storage dos attachments;
- delete e upload precisam gerar auditoria.

## Dossiê

Consulta base:

```text
organization
+ período
+ contas selecionadas
+ bank_statement_document
+ financial_transaction
+ attachment
```

Ordem padrão:

```text
Conta
→ Extrato oficial
→ Transações por data
→ Dados da despesa
→ Comprovante de pagamento
→ Documento fiscal
→ Outros anexos
```

Antes de gerar, o backend deve retornar pendências como:

```text
extrato ausente
despesas sem comprovante
despesas sem documento fiscal
conta sem movimento
anexo indisponível
```

A geração não deve alterar dados financeiros; apenas monta um PDF/arquivo de conferência a partir dos registros existentes.

---

# Flyway

Configuração:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

Regras obrigatórias:

```text
Nunca alterar migration antiga já aplicada.
Toda alteração estrutural gera nova migration.
Migrations devem ser testadas em banco limpo e banco com dados.
```

Próximas migrations prováveis:

```text
bank_statement_document
índices para suggestion_key
restrições de SupportAgreement ativo
campos diretos de auditoria ainda não mapeados
```

---

# Operação e produção

Antes de crescer o uso:

- backup periódico do PostgreSQL;
- teste de restore;
- backup e recuperação de storage/anexos;
- validação de tipo/tamanho de arquivo;
- storage externo seguro;
- monitoramento e logs;
- testes automatizados dos fluxos financeiros críticos;
- testes de isolamento entre organizações.

Fluxos prioritários para testes:

```text
Importar Maio
Importar Maio novamente
Importar Maio + Junho
Sugestão com data variável no rawDescription
Sugestão com histórico conflitante
Transferência e cancelamento
Pagamento de fatura
Saldo de fund negativo bloqueado
Isolamento de tenant
Dossiê com documentação faltante
```
