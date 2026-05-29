# Database Architecture — FluxFund

Banco PostgreSQL versionado com Flyway para o sistema financeiro SaaS FluxFund.

> Documento atualizado em **28/05/2026** para registrar entidades já incorporadas ao domínio, regras de relatório/exportação e evolução necessária para autenticação, auditoria e venda como SaaS.

---

# Princípios do Modelo

O banco deve suportar:

- multi-tenant por organização;
- contas reais e fundos internos separados conceitualmente;
- categorias hierárquicas;
- favorecidos e compromissos fixos;
- transações oficiais manuais ou importadas via OFX;
- alocações internas;
- anexos/documentos financeiros;
- relatórios e exportações confiáveis;
- futura autenticação, autorização e auditoria.

Regra estrutural:

```text
Toda entidade pertencente a um cliente deve conter organization_id
ou ser alcançável somente por entidade validada da organização.
```

---

# Estado das Entidades

| Entidade/tabela | Estado funcional | Finalidade |
|---|---|---|
| `organization` | Existente | Tenant/empresa. |
| `app_user` | Base existente | Usuário; será ativado no login JWT. |
| `organization_user` | Base existente | Relação usuário-organização e role. |
| `account` | Implementada | Dinheiro real. |
| `category` | Implementada | Classificação financeira hierárquica. |
| `fund` | Implementada | Destinação/orçamento interno. |
| `beneficiary` | Implementada | Favorecido/destinatário. |
| `financial_transaction` | Implementada | Lançamento oficial. |
| `transaction_allocation` | Implementada | Distribuição por fundo/favorecido. |
| `attachment` | Implementada | Metadados/referência de arquivos. |
| `organization_settings` | Implementada no fluxo | Fundo padrão/Caixa Base. |
| `support_agreement` | Implementada no fluxo | Compromissos fixos de sustento. |

Observação: conferir as migrations e gerar zip atualizado após o commit atual para que o pacote arquivado reflita todas as tabelas implementadas.

---

# Multi-Tenant

## Fase atual

As consultas utilizam `organization_id`, mas o frontend ainda pode enviar um ID fixo/temporário.

## Evolução obrigatória

Após login:

```text
JWT identifica usuário
-> organização ativa é informada no contexto da requisição
-> backend valida organization_user
-> role determina autorização
-> qualquer UUID de tenant não autorizado é rejeitado
```

O isolamento não pode depender apenas do frontend.

---

# Estrutura Financeira

## account

Representa dinheiro real: banco, caixa, carteira ou conta digital.

## fund

Representa destinação interna/projeto/orçamento.

```text
Fund != Account
```

Regra de saldo:

```text
currentBalance = initialBalance + soma(transaction_allocation.amount)
```

## category

Representa classificação financeira, com hierarquia via `parent_id`.

```text
Categoria filha deve ter o mesmo type da categoria pai.
```

## beneficiary

Representa favorecido/destinatário. Não deve armazenar diretamente salário/sustento fixo; isso pertence a `support_agreement`.

---

# financial_transaction

Lançamento financeiro oficial do sistema.

Fluxo atual:

```text
OFX -> financial_transaction
```

`bank_transaction` não deve voltar ao fluxo principal sem necessidade nova comprovada.

Campos centrais:

```text
id
organization_id
account_id
category_id
type
source
status
external_id
due_date
settlement_date
expected_amount
settled_amount
interest_amount
discount_amount
description
raw_description
document_number
imported_at
classified_at
created_at
updated_at
```

## Regras de consulta

### A classificar

```text
category_id is null
status != CANCELED
```

### A alocar

```text
status = SETTLED
category_id is not null
type != TRANSFER
abs(settled_amount) > soma(abs(transaction_allocation.amount))
```

### Listagem padrão

```text
sem status informado -> status != CANCELED
com status informado -> status = filtro recebido
```

---

# transaction_allocation

Divide transações em fundos e favorecidos.

Campos centrais:

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

Sinal:

```text
INCOME  -> amount positivo
EXPENSE -> amount negativo
TRANSFER -> não deve gerar resultado/alocação operacional normal
```

---

# organization_settings

Representa configurações específicas de uma organização.

Uso atual:

```text
default_fund_id -> Fundo Padrão / Caixa Base
```

Regra:

```text
Sem alocação manual em transação classificada + default fund configurado
-> criar alocação automática integral no fundo padrão.

Alocação manual parcial
-> não completar automaticamente;
-> restante permanece pendente para ação explícita.
```

Campos esperados/implementados conforme migration atual:

```text
id
organization_id
default_fund_id
created_at
updated_at
```

---

# support_agreement

Representa compromissos fixos mensais de sustento/pagamento por beneficiário e fundo.

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

Regra importante:

```text
Compromisso fixo não é oferta destinada.
Oferta soma ao compromisso.
```

Cálculo no relatório:

```text
commitmentAmount  = valor mensal válido no período (multiplicado pelos meses aplicáveis)
allocatedAmount   = soma das ofertas/destinações positivas
transferredAmount = soma absoluta dos repasses negativos
payableAmount     = commitmentAmount + allocatedAmount
pendingAmount     = payableAmount - transferredAmount
```

Recomendação de integridade:

```text
Evitar mais de um support_agreement ativo para a mesma combinação
organization_id + beneficiary_id + fund_id,
salvo decisão futura explícita de múltiplos contratos cumulativos.
```

---

# attachment

Armazena metadados e referência de documentos vinculados a uma transação.

Campos conceituais:

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

O arquivo binário não deve ficar no PostgreSQL. O banco armazena referência para storage.

## Indicadores operacionais

Para a listagem/exportação de transações, pode ser necessário calcular por transação:

```text
attachmentCount
paymentProofAttachmentCount
fiscalAttachmentCount
```

Interpretação operacional de contas pagas:

```text
PROOF_OF_PAYMENT -> comprova pagamento
qualquer tipo fiscal/documental adequado -> auxilia comprovação do gasto
```

A decisão de tratar `OTHER` ou `CONTRACT` como comprovação fiscal definitiva pode futuramente virar configuração/regra mais rigorosa.

---

# Transferências entre Accounts

Transferências devem ser representadas por `FinancialTransactionType.TRANSFER` e não devem afetar:

- resultado por categoria;
- receitas/despesas;
- saldo de fundos;
- prestação de sustento.

Necessidade futura importante:

```text
Conciliar duas pontas importadas via OFX:
saída da conta A + entrada na conta B -> uma transferência lógica vinculada.
```

---

# Relatórios e Regras de Dados

## Dashboard

Calcula receitas, despesas, resultado, saldo real, saldo interno e contagens de pendência.

## Resultado por Categoria

Agrupa receitas/despesas por categoria e hierarquia pai/filha.

## Fundos

```text
periodBalance = incomeAllocated - expenseAllocated
currentBalance = initialBalance + alocações históricas
```

## Prestação / Sustento

Agrupamento principal:

```text
beneficiary + fund
```

Detalhamento adicional:

```text
beneficiary + fund + account
```

Regra principal já adotada:

```text
pendingAmount = commitmentAmount + allocatedAmount - transferredAmount
```

Regra do detalhamento por banco:

```text
account mostra apenas movimentações reais associadas à transação;
compromisso fixo não possui banco de origem automaticamente.
```

## Exportações Excel

Os exports usam os mesmos cálculos do backend, evitando duplicar regra no frontend.

Implementados:

```text
Prestação / Sustento -> abas de resumo, fundos e bancos.
Movimento Financeiro -> resumo, contas recebidas, contas pagas e todas as transações baixadas.
```

---

# Autenticação, Roles e Auditoria — Próxima Evolução Estrutural

## Usuários e roles

Entidades base:

```text
app_user
organization_user
```

Roles previstas:

```text
OWNER
ADMIN
FINANCE
VIEWER
```

## JWT e tenant validado

Fluxo esperado:

```text
login -> JWT -> usuário autenticado -> organização ativa -> validação de membership/role
```

## Auditoria após login

Adicionar campos onde necessário:

```text
created_by
updated_by
canceled_by
canceled_at
uploaded_by
deactivated_by
activated_by
```

Prioridade:

- `financial_transaction`;
- `transaction_allocation`;
- `attachment`;
- `support_agreement`;
- `organization_settings`.

---

# Backup, Storage e Produção

Excel ajuda na conferência e confiança operacional, mas não substitui backup técnico.

Antes de uso oficial contínuo:

- backup automatizado de PostgreSQL;
- backup/restauração do storage de anexos;
- limites e validação de arquivos;
- storage externo seguro;
- secrets fora do repositório;
- HTTPS;
- logs e monitoramento.

---

# Flyway e Migrations

Configuração:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

Regra:

```text
Nunca alterar migrations antigas já commitadas.
Criar nova migration para cada mudança estrutural.
```

Após concluir a fase atual, conferir se há migrations registrando:

- `attachment`;
- `organization_settings`;
- `support_agreement`;
- campos necessários às exportações/contadores de documentos;
- futuras alterações de autenticação/auditoria.

---

# Roadmap de Banco

## Próximo bloco — login

- validar/ajustar `app_user` e `organization_user`;
- senha com hash seguro;
- contexto de usuário autenticado;
- associação de requisições à organização ativa;
- índices/constraints necessários para membership.

## Depois do login

- campos de auditoria;
- exportações adicionais;
- tratamento completo de transferências;
- backups e storage externo;
- política de retenção de anexos.

## Para SaaS vendável

- onboarding de organizações;
- convites e recuperação de senha;
- isolamento testado por tenant;
- exportação completa dos dados do cliente;
- monitoramento e trilhas de auditoria;
- políticas de privacidade e retenção.

