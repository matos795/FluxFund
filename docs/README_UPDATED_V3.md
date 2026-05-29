# FluxFund API

Sistema SaaS de gestão financeira desenvolvido com **Java 21 + Spring Boot + PostgreSQL + Flyway**.

> Documento atualizado em **28/05/2026** para registrar o domínio implementado, as regras de negócio descobertas durante o desenvolvimento e o roadmap até uso interno seguro e futura comercialização SaaS.

---

# Visão do Produto

O FluxFund nasceu para substituir controles financeiros baseados em planilhas e sistemas legados, mantendo as regras reais da operação, mas com uma arquitetura mais limpa, auditável e preparada para múltiplas organizações.

Objetivos do sistema:

- controlar receitas, despesas e futuramente transferências entre contas;
- importar movimentações via OFX e permitir classificação posterior;
- controlar dinheiro real por `Account` e destinação interna por `Fund`;
- alocar valores por fundos e favorecidos;
- controlar compromissos fixos de sustento sem confundi-los com ofertas recebidas;
- guardar comprovantes e documentos fiscais vinculados às transações;
- produzir relatórios e exportações Excel confiáveis para conferência externa;
- evoluir para autenticação, isolamento multi-tenant real, permissões, auditoria e comercialização como SaaS.

---

# Estado Atual do Projeto

## Implementado e validado no fluxo funcional

| Área | Estado | Observação |
|---|---|---|
| Accounts | Implementado | Contas bancárias/caixas representam dinheiro real. |
| Categories | Implementado | Categorias financeiras com suporte a hierarquia. |
| Funds | Implementado | Fundos/projetos representam destinação interna. |
| Beneficiaries | Implementado | Favorecidos/destinatários/responsáveis. |
| Financial Transactions | Implementado | Criação, edição, cancelamento lógico, filtros e visualização. |
| Importação OFX | Implementado | OFX gera `FinancialTransaction` diretamente. |
| Classificação | Implementado | Transações sem categoria seguem fluxo específico de classificação. |
| Transaction Allocations | Implementado | Alocação por fundo e favorecido, incluindo gestão posterior. |
| Attachments | Implementado | Upload, listagem, download e remoção de arquivos vinculados à transação. |
| Organization Settings | Implementado | Configuração do Fundo Padrão/Caixa Base. |
| Support Agreements | Implementado | Compromissos fixos de sustento por favorecido e fundo, com ativação/desativação. |
| Dashboard | Implementado | Métricas e atalhos para pendências. |
| Resultado por Categoria | Implementado | Relatório hierárquico. |
| Fundos/Projetos | Implementado | Relatório de saldos e movimentação por fundo. |
| Prestação/Sustento | Implementado | Agrupamento por favorecido, fundos e visão por banco/account. |
| Exportação Excel da Prestação | Implementado | Arquivo estilizado com resumo, fundos e detalhamento por banco. |
| Exportação Excel de Movimento | Implementado | Contas recebidas, contas pagas e todas as transações baixadas. |

## Em fechamento antes do login

Estes itens foram definidos ou iniciados no refinamento final da tela principal e devem ser confirmados com teste antes do próximo commit:

- atualização automática da coluna de documentos/anexos após upload ou remoção;
- bloqueio do salvamento em `Classificar` quando existe arquivo selecionado, mas ainda não enviado;
- indicador visual de documentação fiscal na tabela de transações;
- layout compacto da `TransactionsPage`, com filtros avançados recolhíveis, exportação em dialog e clique na linha para abrir a ação principal.

## Próximo grande bloco

```text
Autenticação JWT + organização ativa + permissões + remoção do TEMP_ORGANIZATION_ID
```

---

# Stack Tecnológica

## Backend

- Java 21
- Spring Boot
- Spring Data JPA
- Spring Validation
- Spring Security — próxima etapa com JWT
- Flyway
- PostgreSQL
- SpringDoc OpenAPI / Swagger
- Lombok
- Apache POI para exportações `.xlsx`

## Ferramentas

- Git + GitHub
- VS Code / IDE Java
- pgAdmin
- Swagger UI

---

# Conceitos Centrais do Domínio

## Organization

Representa uma empresa/cliente dentro da plataforma. Todas as entidades financeiras relevantes pertencem a uma organização.

Na fase atual, `organizationId` ainda é enviado explicitamente. Na fase de autenticação, o backend deverá validar a organização ativa de acordo com o usuário logado.

## Account

Representa **dinheiro real**.

Exemplos:

- conta bancária;
- caixa físico;
- carteira;
- conta digital.

Regra fundamental:

```text
Account = onde o dinheiro existe de fato.
Fund = para que o dinheiro foi destinado internamente.
```

Uma transferência entre accounts não é receita nem despesa operacional.

## Fund

Representa destinação interna, projeto, orçamento ou centro de responsabilidade.

Exemplos:

- Projeto Piauí;
- Projeto Guiné;
- Livraria;
- Caixa Base.

Um `Fund` não representa banco. Ele é usado para alocações, relatórios, prestação de contas e controle interno.

Regra de saldo:

```text
currentBalance = initialBalance + soma(transaction_allocation.amount)
```

Funds podem ficar negativos.

## Category

Representa a natureza/classificação financeira da transação.

Exemplos:

- Oferta destinada;
- Combustível;
- Repasse missionário;
- Administrativo.

Categorias possuem tipo:

```text
INCOME ou EXPENSE
```

Podem ser hierárquicas via `parent_id`.

Regra:

```text
Categoria filha deve ter o mesmo tipo da categoria pai.
```

## Beneficiary

Representa favorecido, destinatário ou responsável.

Exemplos:

- missionário;
- fornecedor;
- funcionário;
- estagiário;
- responsável por projeto.

Nem todo beneficiário possui lógica de sustento. Para missionários ou outros beneficiários com pagamento fixo, a obrigação recorrente é representada por `SupportAgreement`, não por campo fixo em `Beneficiary`.

---

# FinancialTransaction

Representa o lançamento financeiro oficial do sistema.

Pode ser:

- criado manualmente;
- importado via OFX.

Fluxo atual:

```text
OFX -> FinancialTransaction
```

A antiga ideia de `BankTransaction` deixou de ser o fluxo principal.

## Campos relevantes

- `account`;
- `category`;
- `type`;
- `source`;
- `status`;
- `externalId`;
- `rawDescription`;
- `description`;
- `dueDate`;
- `settlementDate`;
- `expectedAmount`;
- `settledAmount`;
- `interestAmount`;
- `discountAmount`;
- `importedAt`.

## Descrição original e descrição editável

Para lançamentos de OFX:

```text
rawDescription = texto original recebido do banco
```

A `description` é opcional e editável pelo usuário.

Regra de UI/relatórios:

```text
Mostrar description quando preenchida.
Preservar rawDescription para auditoria e conferência da origem.
```

---

# Tipos e Status da Transação

## Tipos

| Tipo | Significado |
|---|---|
| `INCOME` | Receita/entrada financeira. |
| `EXPENSE` | Despesa/saída financeira. |
| `TRANSFER` | Movimentação entre accounts; não compõe receita/despesa operacional. |

## Status

| Status | Significado |
|---|---|
| `IMPORTED` | Importada via OFX e ainda pendente de conferência/classificação, se usado no modelo atual. |
| `PENDING` | Lançamento pendente. |
| `SETTLED` | Lançamento liquidado/pago/recebido. |
| `CANCELED` | Cancelamento lógico, preservando histórico. |

## Origem

| Source | Significado |
|---|---|
| `MANUAL` | Criado manualmente. |
| `OFX` | Importado via arquivo OFX. |

---

# Regras Financeiras Gerais

## Juros e desconto

```text
settledAmount > expectedAmount -> diferença pode ser interestAmount
settledAmount < expectedAmount -> diferença pode ser discountAmount
```

## Liquidação

```text
settlementDate != null -> SETTLED
settlementDate == null -> PENDING
```

## Cancelamento lógico

Transações financeiras não devem ser apagadas fisicamente do histórico.

```text
DELETE/cancelamento -> status = CANCELED
```

Listagens comuns não exibem canceladas por padrão; elas devem aparecer apenas quando filtradas explicitamente.

---

# TransactionAllocation

Responsável por dividir uma transação oficial entre fundos e, opcionalmente, favorecidos.

Exemplo de receita:

```text
R$ 1.000 recebidos:
- R$ 700 -> Fund Projeto Piauí -> Beneficiary Missionário João
- R$ 300 -> Fund Livraria -> Beneficiary NULL
```

## Regra de sinal

```text
INCOME  -> allocation.amount positivo
EXPENSE -> allocation.amount negativo
```

A alocação não altera saldo bancário real; ela altera a leitura interna de fundos e prestação de contas.

## A classificar

```text
category is null
status != CANCELED
```

Enquanto estiver sem categoria, a ação principal deve ser classificar, sem disponibilizar livremente todos os fluxos operacionais.

## A alocar

```text
status = SETTLED
category is not null
type != TRANSFER
abs(settledAmount) > soma(abs(allocations.amount))
```

Uma transação sem categoria não deve aparecer simultaneamente como “a alocar”.

---

# Organization Settings e Fundo Padrão / Caixa Base

Implementado para permitir que cada organização defina um fundo padrão, sem hardcode.

Estrutura conceitual:

```text
organization_settings.default_fund_id
```

Regra implementada/decidida:

```text
Se uma transação for classificada sem nenhuma alocação manual
 e existir fundo padrão configurado,
 então o backend cria a alocação automática no fundo padrão.
```

Regra importante de controle:

```text
Se o usuário fizer alocação parcial manual,
 o restante NÃO é enviado automaticamente ao fundo padrão.
 Ele continua pendente e pode ser resolvido por ação explícita
 “Alocar restante no fundo padrão”.
```

Isso evita esconder pendências em um sistema financeiro.

---

# SupportAgreement — Compromissos Fixos de Sustento

Implementado para representar obrigações fixas da organização com beneficiários.

Exemplo:

```text
Missionário João / Projeto Piauí / R$ 1.000 por mês
```

## Regra conceitual

O compromisso fixo funciona como sustento/salário garantido. Ofertas destinadas são adicionais, não substituem o compromisso.

```text
commitmentAmount  = compromissos fixos válidos no período
allocatedAmount   = ofertas/destinações recebidas
transferredAmount = repasses/utilizações realizados
payableAmount     = commitmentAmount + allocatedAmount
pendingAmount     = payableAmount - transferredAmount
```

Exemplo:

```text
Compromisso fixo:     R$ 1.000
Oferta destinada:     R$   300
Total devido:         R$ 1.300
Repassado:            R$   500
A repassar:           R$   800
```

## Vigência

O compromisso possui:

- favorecido;
- fundo;
- valor mensal;
- data inicial;
- data final opcional;
- status ativo/inativo;
- descrição.

Para relatório em período com mais de um mês, o valor mensal é multiplicado pelos meses cobertos pela vigência no período.

## Ativação e desativação

- desativação é lógica;
- existe ação para reativar compromisso;
- não deve existir mais de um compromisso ativo para o mesmo `beneficiary + fund` quando essa duplicidade representaria cobrança dupla indevida.

---

# Attachments — Anexos Financeiros

Implementado para associar documentos a transações financeiras.

## Tipos suportados

```text
RECEIPT
INVOICE
PROOF_OF_PAYMENT
CONTRACT
OTHER
```

## Regra de storage

O PostgreSQL armazena metadados e referência; o arquivo não deve ser gravado diretamente como blob no banco.

```text
organizations/{organizationId}/transactions/{transactionId}/{arquivo}
```

Em desenvolvimento, storage local é aceitável. Para produção/SaaS, migrar para storage seguro como S3/R2 ou equivalente.

## Uso operacional

- detalhes exibem anexos em leitura;
- classificação permite enviar anexos;
- ação específica de anexos permite gerenciar documentos em transações classificadas/liquidadas;
- contas pagas devem permitir identificar presença de comprovante de pagamento e de documento fiscal.

## Regra de documento pendente na classificação

Checklist de refinamento final:

```text
Sem arquivo selecionado -> pode salvar classificação.
Arquivo selecionado e enviado -> pode salvar classificação.
Arquivo selecionado mas não enviado -> bloquear salvar e avisar o usuário.
```

---

# Relatórios Implementados

## Dashboard Summary

```text
GET /api/v1/dashboard/summary
```

Exibe métricas de receitas, despesas, resultado, saldos e pendências de classificação/alocação.

## Resultado por Categoria

```text
GET /api/v1/reports/category-result
```

Demonstra receitas/despesas por plano de contas hierárquico.

## Fundos e Projetos

```text
GET /api/v1/reports/funds
```

Calcula por fundo:

```text
initialBalance
incomeAllocated
expenseAllocated
periodBalance
currentBalance
allocationCount
```

## Prestação de Contas / Sustento

```text
GET /api/v1/reports/accountability
GET /api/v1/reports/accountability/by-account
```

Estrutura de leitura do frontend:

```text
Beneficiário
  -> resumo geral
  -> fundos/projetos expansíveis
      -> bancos/accounts expansíveis
```

Regra total do beneficiário/fundo:

```text
A repassar = compromisso fixo + ofertas destinadas - repasses realizados
```

Regra do detalhamento por banco:

```text
Banco mostra movimentações reais de ofertas e repasses vinculadas à account.
Compromisso fixo não é atribuído automaticamente a um banco específico.
```

## Exportações Excel implementadas

### Prestação / Sustento

```text
GET /api/v1/reports/accountability/export.xlsx
```

Arquivo estilizado com abas:

- Resumo por favorecido;
- Fundos por favorecido;
- Detalhamento por banco.

### Movimento Financeiro Baixado

```text
GET /api/v1/financial-transactions/export/settled.xlsx
```

Arquivo estilizado com abas:

- Resumo;
- Contas Recebidas;
- Contas Pagas;
- Todas as Transações.

A exportação de contas pagas deve sinalizar a existência de comprovante de pagamento e anexo fiscal/documental para auxiliar conferência.

---

# API REST — Recursos Principais

## Financial Transactions

```text
POST   /api/v1/financial-transactions
GET    /api/v1/financial-transactions
GET    /api/v1/financial-transactions/{id}
PUT    /api/v1/financial-transactions/{id}
DELETE /api/v1/financial-transactions/{id}
GET    /api/v1/financial-transactions/export/settled.xlsx
```

Filtros relevantes:

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

## Attachments

A rota efetiva segue o contexto da transação:

```text
POST   /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/financial-transactions/{transactionId}/attachments
GET    /api/v1/financial-transactions/{transactionId}/attachments/{attachmentId}/download
DELETE /api/v1/financial-transactions/{transactionId}/attachments/{attachmentId}
```

## Organization Settings

```text
GET /api/v1/organization-settings
PUT /api/v1/organization-settings
```

## Support Agreements

```text
POST   /api/v1/support-agreements
GET    /api/v1/support-agreements
GET    /api/v1/support-agreements/{id}
PUT    /api/v1/support-agreements/{id}
DELETE /api/v1/support-agreements/{id}
PATCH  /api/v1/support-agreements/{id}/activate
```

## Reports

```text
GET /api/v1/dashboard/summary
GET /api/v1/reports/category-result
GET /api/v1/reports/funds
GET /api/v1/reports/accountability
GET /api/v1/reports/accountability/by-account
GET /api/v1/reports/accountability/export.xlsx
```

---

# Arquitetura Multi-Tenant Atual e Próxima Etapa

Todas as entidades principais possuem `organization_id`.

## Fase atual

```text
Frontend ainda utiliza TEMP_ORGANIZATION_ID / organizationId enviado explicitamente.
```

## Próxima fase obrigatória

```text
Usuário faz login
-> backend autentica com JWT
-> frontend armazena sessão/token
-> usuário seleciona organização ativa
-> requests enviam contexto da organização ativa
-> backend valida membership em organization_user
-> services deixam de confiar em organizationId arbitrário
-> TEMP_ORGANIZATION_ID é removido do frontend
```

---

# Segurança, Roles e Auditoria

## Roles previstas

```text
OWNER
ADMIN
FINANCE
VIEWER
```

Matriz inicial recomendada:

| Operação | OWNER | ADMIN | FINANCE | VIEWER |
|---|---:|---:|---:|---:|
| Consultar dashboard/relatórios | Sim | Sim | Sim | Sim |
| Exportar relatórios | Sim | Sim | Sim | Sim, conforme política |
| Criar/classificar transações | Sim | Sim | Sim | Não |
| Gerenciar alocações e anexos | Sim | Sim | Sim | Não |
| Gerenciar compromissos | Sim | Sim | Conforme decisão | Não |
| Gerenciar configurações | Sim | Sim | Não | Não |
| Gerenciar usuários/roles | Sim | Sim | Não | Não |

## Auditoria necessária após login

Adicionar rastreabilidade de usuário em operações críticas:

```text
created_by
updated_by
canceled_by
canceled_at
uploaded_by
activated_by / deactivated_by quando relevante
```

Prioridades:

- `financial_transaction`;
- `transaction_allocation`;
- `attachment`;
- `support_agreement`;
- `organization_settings`.

---

# Banco de Dados e Migrations

O projeto utiliza PostgreSQL e Flyway.

```properties
spring.jpa.hibernate.ddl-auto=validate
```

Regra obrigatória:

```text
Nunca alterar migration antiga já commitada.
Toda mudança estrutural deve gerar uma nova migration.
```

---

# Roadmap para Implementação Real

## Fase 0 — Fechar UX atual antes do login

- validar sincronização visual dos anexos na tabela;
- validar bloqueio de upload pendente na classificação;
- confirmar exportações Excel com dados de teste reais;
- atualizar documentação e gerar novos zips de backup.

## Fase 1 — Login JWT e sessão autenticada — próximo passo

Backend:

- senha criptografada com `PasswordEncoder`;
- `/api/v1/auth/login`;
- geração e validação de JWT;
- filtro de autenticação;
- `/api/v1/auth/me`;
- proteger endpoints financeiros.

Frontend:

- página `/login`;
- controle de sessão;
- interceptor Axios com `Authorization: Bearer ...`;
- rotas privadas;
- logout.

## Fase 2 — Multi-tenant real e organização ativa

- listar organizações do usuário;
- seletor de organização ativa;
- validar membership no backend;
- enviar organização ativa via contexto/header definido;
- remover `TEMP_ORGANIZATION_ID`.

## Fase 3 — Permissões e usuários

- aplicar roles nas operações;
- tela de usuários da organização;
- convite/criação de usuários;
- alteração de roles;
- bloquear ações e rotas conforme permissão.

## Fase 4 — Auditoria e operação segura

- campos de auditoria por usuário;
- histórico/log de alterações críticas;
- backup automático do PostgreSQL;
- backup e restauração de anexos;
- validação de tamanho/tipo de upload;
- storage externo seguro em ambiente real.

## Fase 5 — Relatórios e exportações complementares

- Excel do relatório de Fundos;
- Excel do Resultado por Categoria;
- relatório Movimentação por Beneficiário;
- fluxo confiável de transferência entre accounts;
- PDF formal da Prestação de Contas;
- CSV somente se houver necessidade de integração ou importação externa.

## Fase 6 — Experiência e análise

- gráficos e indicadores executivos;
- configurações adicionais da organização;
- logo/nome em relatórios exportados;
- exigência configurável de documentos fiscais;
- notificações de pendências.

## Fase 7 — Preparação para venda como SaaS

- onboarding de organizações;
- convites, recuperação e troca de senha;
- separação segura de dados por tenant;
- HTTPS, secrets e configuração por ambiente;
- armazenamento de arquivos em nuvem;
- monitoramento/logs/alertas;
- testes automatizados críticos;
- política de privacidade e retenção de documentos;
- exportação completa de dados da organização;
- planos, limites e cobrança apenas após maturidade operacional.

---

# Próxima Decisão de Desenvolvimento

A partir deste ponto, evitar novas features cosméticas antes da autenticação.

```text
Próximo passo recomendado: implementar Login JWT no backend e, em seguida, no frontend.
```

