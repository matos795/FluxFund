# Controleii API

Sistema SaaS de gestão financeira desenvolvido com Java + Spring Boot.

O projeto foi criado para substituir um sistema financeiro interno baseado em planilhas e aplicações legadas, trazendo uma arquitetura moderna, escalável e preparada para múltiplas organizações (multi-tenant).

---

# Objetivos do Sistema

O sistema permite:

- Gestão de contas bancárias e caixas físicos
- Importação de OFX
- Conciliação bancária
- Controle de receitas e despesas
- Categorias financeiras
- Fundos/caixas de destinação
- Favorecidos (missionários, fornecedores, responsáveis etc.)
- Rateio/alocação de valores
- Anexos de comprovantes e documentos
- Estrutura SaaS multi-tenant

---

# Stack Tecnológica

## Backend

- Java 21
- Spring Boot
- Spring Data JPA
- Flyway
- PostgreSQL

## Ferramentas

- Git + GitHub
- VS Code
- pgAdmin

---

# Conceitos Importantes

## Account

Representa dinheiro real.

Exemplos:

- Conta bancária
- Caixa físico
- Carteira
- Conta digital

O saldo da account representa saldo financeiro real.

---

## Fund

Representa uma destinação/orçamento interno.

Exemplos:

- Projeto Piauí
- Projeto Guiné
- Livraria
- Pães

Um Fund NÃO representa uma conta bancária.

Funds são utilizados para organização financeira e relatórios internos.

---

## Beneficiary

Representa o favorecido/destinatário de um valor.

Exemplos:

- Missionários
- Fornecedores
- Funcionários
- Responsáveis por projetos

---

## BankTransaction

Representa uma movimentação importada do banco (OFX).

É o dado bruto vindo da instituição financeira.

---

## FinancialTransaction

Representa o lançamento financeiro oficial do sistema.

Pode ser:
- criado manualmente
- conciliado a partir de um OFX

---

## TransactionAllocation

Responsável por dividir uma transação entre:
- fundos
- favorecidos

Exemplo:

R$ 1000 recebidos:

- R$ 700 → Projeto Piauí → Missionário João
- R$ 300 → Livraria

---

# Estrutura Inicial do Banco

## Principais tabelas

- organization
- app_user
- organization_user
- account
- category
- fund
- beneficiary
- bank_transaction
- financial_transaction
- transaction_allocation
- attachment

---

# Banco de Dados

O projeto utiliza:

- PostgreSQL
- Flyway para versionamento de migrations

## Importante

O Hibernate NÃO cria automaticamente o banco.

Configuração utilizada:

```properties
spring.jpa.hibernate.ddl-auto=validate