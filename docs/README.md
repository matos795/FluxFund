# FluxFund API

Sistema SaaS de gestão financeira desenvolvido com Java + Spring Boot.

O projeto foi criado para substituir sistemas financeiros internos baseados em planilhas e aplicações legadas, trazendo uma arquitetura moderna, escalável e preparada para múltiplas organizações (multi-tenant).

---

# Objetivos do Sistema

O sistema permite:

* Gestão de contas bancárias e caixas físicos
* Controle de receitas e despesas
* Categorias financeiras hierárquicas
* Fundos/orçamentos internos
* Favorecidos financeiros
* Alocação de valores por fundos e favorecidos
* Anexos financeiros
* Importação OFX
* Estrutura SaaS multi-tenant
* Auditoria financeira

---

# Stack Tecnológica

## Backend

* Java 21
* Spring Boot
* Spring Data JPA
* Spring Validation
* Flyway
* PostgreSQL
* SpringDoc OpenAPI

## Ferramentas

* Git + GitHub
* VS Code
* pgAdmin
* Swagger UI

---

# Conceitos Importantes

## Account

Representa dinheiro real.

Exemplos:

* Conta bancária
* Caixa físico
* Carteira
* Conta digital

O saldo da account representa saldo financeiro real.

---

## Fund

Representa uma destinação/orçamento interno.

Exemplos:

* Projeto Missionário
* Construção
* Livraria
* Jovens

Um Fund NÃO representa uma conta bancária.

Funds são utilizados para:

* organização financeira
* relatórios internos
* prestação de contas
* alocação financeira

---

## Beneficiary

Representa favorecidos/destinatários financeiros.

Exemplos:

* Missionários
* Fornecedores
* Funcionários
* Responsáveis por projetos

---

## FinancialTransaction

Representa o lançamento financeiro oficial do sistema.

Pode ser:

* criado manualmente
* importado via OFX

Toda movimentação financeira do sistema gira em torno desta entidade.

---

## TransactionAllocation

Responsável por dividir uma transação entre:

* fundos
* favorecidos

Exemplo:

R$ 1000 recebidos:

* R$ 700 → Projeto Missionário → Missionário João
* R$ 300 → Livraria

---

# Regras Financeiras

## Tipos de Transação

### INCOME

Representa receitas.

### EXPENSE

Representa despesas.

---

# Status da Transação

| Status   | Significado                                |
| -------- | ------------------------------------------ |
| IMPORTED | Importado via OFX e ainda não categorizado |
| PENDING  | Lançamento pendente                        |
| SETTLED  | Lançamento liquidado/pago/recebido         |
| CANCELED | Lançamento cancelado                       |

---

# Source da Transação

| Source | Significado        |
| ------ | ------------------ |
| MANUAL | Criado manualmente |
| OFX    | Importado via OFX  |

---

# Regras Automáticas

O sistema aplica automaticamente algumas regras financeiras:

## Juros

Se:

```text
settledAmount > expectedAmount
```

O valor excedente é salvo em:

```text
interestAmount
```

---

## Desconto

Se:

```text
settledAmount < expectedAmount
```

A diferença é salva em:

```text
discountAmount
```

---

## Liquidação

Se:

```text
settlementDate != null
```

O status automaticamente se torna:

```text
SETTLED
```

Caso contrário:

```text
PENDING
```

---

## Soft Cancel

O sistema não remove transações financeiras.

Ao deletar:

```text
status = CANCELED
```

Isso preserva auditoria e histórico financeiro.

---

# Arquitetura Multi-Tenant

Todas as entidades principais possuem:

```text
organization_id
```

Isso garante isolamento completo entre organizações/clientes.

As consultas principais validam:

* organizationId
* entidades ativas
* isolamento financeiro

---

# Estrutura Atual do Banco

## Principais tabelas

* organization
* app_user
* organization_user
* account
* category
* fund
* beneficiary
* financial_transaction
* transaction_allocation
* attachment

---

# Evolução Arquitetural

## Remoção de BankTransaction

Inicialmente o projeto possuía:

```text
OFX -> BankTransaction -> FinancialTransaction
```

Após evolução do domínio, o sistema passou a utilizar:

```text
OFX -> FinancialTransaction
```

Com:

```text
FinancialTransactionSource
```

Isso simplificou:

* o domínio
* a importação OFX
* o fluxo financeiro
* a categorização

---

# API REST

## Recursos implementados

### Financial Transactions

* POST /api/v1/financial-transactions
* GET /api/v1/financial-transactions
* GET /api/v1/financial-transactions/{id}
* PUT /api/v1/financial-transactions/{id}
* DELETE /api/v1/financial-transactions/{id}

---

# Swagger / OpenAPI

O projeto utiliza:

```text
springdoc-openapi-starter-webmvc-ui
```

Swagger disponível em:

```text
http://localhost:8080/swagger-ui/index.html
```

---

# Banco de Dados

O projeto utiliza:

* PostgreSQL
* Flyway para versionamento de migrations

Configuração atual:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

O Hibernate NÃO cria automaticamente as tabelas.

Toda alteração estrutural deve ocorrer via migrations Flyway.

---

# Estratégia de Migrations

Todas as alterações estruturais devem ser feitas através de migrations versionadas:

```text
V1__create_initial_tables.sql
V2__create_financial_core_tables.sql
V3__create_beneficiary_table.sql
V4__create_transaction_tables.sql
```

Migrations antigas não devem ser alteradas após commitadas.

---

# Próximos Passos

Futuras evoluções previstas:

* Transaction Allocation
* Importação OFX
* Open Finance
* Conciliação automática
* Dashboards
* Relatórios financeiros
* Recorrência financeira
* Auditoria avançada
* Permissões avançadas
* Centro de custos
* Anexos financeiros
* Dashboard SaaS
