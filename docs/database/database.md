# Database Architecture

## Visão Geral

O banco de dados foi modelado para suportar:

- arquitetura SaaS multi-tenant
- conciliação bancária
- alocação financeira por fundos
- favorecidos/destinatários
- anexos financeiros
- importação OFX

O sistema utiliza PostgreSQL + Flyway.

---

# Conceitos Arquiteturais

## Multi-Tenant

Todas as tabelas principais possuem:

```text
organization_id
```

Isso garante isolamento entre organizações/clientes do SaaS.

---

# Principais Entidades

## organization

Representa uma empresa/organização dentro da plataforma.

---

## app_user

Usuário do sistema.

---

## organization_user

Relacionamento entre usuários e organizações.

Permite:

- múltiplos usuários por organização
- um usuário em várias organizações

---

# Estrutura Financeira

## account

Representa dinheiro real.

Exemplos:

- conta bancária
- caixa físico
- carteira
- conta digital

### Observações

Funds NÃO são accounts.

O saldo de `account` representa saldo financeiro real.

---

## category

Classificação financeira.

Exemplos:

- aluguel
- combustível
- oferta missionária
- livraria

Categorias podem possuir hierarquia utilizando:

```text
parent_id
```

---

## fund

Representa uma destinação financeira/orçamento interno.

Exemplos:

- Projeto Piauí
- Projeto Guiné
- Livraria
- Pães

Funds não representam contas bancárias.

São utilizados para:

- organização financeira
- prestação de contas
- relatórios internos

---

## beneficiary

Representa favorecidos/destinatários financeiros.

Exemplos:

- missionários
- fornecedores
- funcionários

---

# Transações

## bank_transaction

Representa movimentações importadas do banco (OFX).

### Características

- dado bruto
- origem bancária
- ainda não categorizado

### Status

| Status | Significado |
|---|---|
| IMPORTED | importado e pendente |
| RECONCILED | conciliado |

---

## financial_transaction

Representa o lançamento financeiro oficial do sistema.

Pode:

- ser manual
- vir de uma conciliação OFX

### Informações financeiras suportadas

- emissão
- vencimento
- baixa
- juros
- descontos
- documentos

---

## transaction_allocation

Responsável por dividir valores entre:

- fundos
- favorecidos

### Exemplo

| Fundo | Favorecido | Valor |
|---|---|---|
| Projeto Piauí | Missionário João | 700 |
| Livraria | NULL | 300 |

---

# Anexos

## attachment

Armazena referências para arquivos relacionados a lançamentos financeiros.

### Tipos suportados

- comprovantes
- notas fiscais
- recibos
- contratos

O sistema NÃO armazena arquivos diretamente no PostgreSQL.

O banco salva apenas:

```text
storage_key
```

### Exemplo

```text
organizations/abc123/receipts/comprovante.pdf
```

---

# Estratégia de Migrations

O projeto utiliza Flyway.

Todas as alterações estruturais devem ser feitas através de migrations versionadas:

```text
V1__create_initial_tables.sql
V2__create_financial_core_tables.sql
V3__create_beneficiary_table.sql
V4__create_transaction_tables.sql
```

Migrations antigas não devem ser alteradas após commitadas.

---

# Observações Importantes

## Funds ≠ Accounts

Essa é uma das decisões arquiteturais mais importantes do sistema.

### Account

Representa dinheiro real.

### Fund

Representa destinação/alocação financeira.

---

# Próximos Passos

Futuras evoluções previstas:

- auditoria
- permissões avançadas
- integração Open Finance
- automações
- recorrência financeira
- dashboards
- relatórios avançados