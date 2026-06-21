# FluxFund API

Sistema SaaS de gestão financeira para organizações que precisam controlar movimentação bancária, destinação interna de recursos, prestação de contas e documentação de despesas.

**Stack:** Java 21, Spring Boot, Spring Data JPA, PostgreSQL, Flyway, Spring Security/JWT, Apache POI e armazenamento de anexos por referência.

> Documento atualizado em **20/06/2026**. O FluxFund está em fase de piloto interno controlado, com login, multi-tenant, auditoria e os principais fluxos financeiros já implementados.

---

## Proposta do produto

O FluxFund não trata apenas entradas e saídas. Ele separa três visões que precisam coexistir sem se confundir:

```text
Account = onde o dinheiro existe de fato.
Fund = para qual finalidade interna o dinheiro foi destinado.
Beneficiary = para quem o valor foi destinado ou repassado.
```

O foco atual é atender organizações que precisam de controle financeiro e prestação de contas — por exemplo igrejas, projetos missionários, associações, ONGs e pequenas empresas que trabalham com fundos, repasses e documentação.

---

# Estado atual

## Funcionalidades implementadas

| Área | Estado | Observação |
|---|---|---|
| Autenticação JWT | Implementado | Login, sessão, logout e proteção das rotas. |
| Organização ativa / multi-tenant | Implementado | Requests usam `X-Organization-Id`; backend valida vínculo do usuário com a organização. |
| Roles | Implementado | Papéis `OWNER`, `ADMIN`, `FINANCE` e `VIEWER`, com autorização no backend. |
| Accounts | Implementado | Conta bancária, caixa, carteira, conta digital e cartão de crédito. |
| Categories | Implementado | Categorias de receita/despesa, hierarquia e regras de documentação. |
| Funds | Implementado | Fundos/projetos internos, saldo calculado e prevenção configurável de saldo negativo. |
| Beneficiaries | Implementado | Favorecidos usados em alocações, repasses e compromissos. |
| Financial Transactions | Implementado | Criação, edição, classificação, baixa, cancelamento lógico, filtros e exportação. |
| OFX bancário | Implementado | Importação com deduplicação por identificador externo/FITID quando disponível. |
| CSV | Implementado | Fluxos de importação suportados para bancos/contas com formatos já tratados no projeto. |
| Cartão de crédito | Implementado | Faturas, itens, importação, classificação, anexos e pagamento pela conta pagadora. |
| Transferências entre contas | Implementado | Registro e cancelamento de transferências sem impactar resultado operacional. |
| Alocações | Implementado | Divisão por fundo e favorecido, inclusive posterior à classificação. |
| Attachments | Implementado | Upload, listagem, download e exclusão de comprovantes e documentos fiscais. |
| Compromissos | Implementado | `SupportAgreement` por favorecido/fundo, com vigência e ativação/desativação. |
| Dashboard | Implementado | Métricas, pendências, saldos e gráficos de movimentação. |
| Relatórios | Implementado | Resultado por categoria, fundos, prestação/sustento, fluxo de caixa por conta e auditoria. |
| Exportações Excel | Implementado | Prestação/sustento e movimento financeiro liquidado. |
| Auditoria | Implementado | Histórico de ações críticas, filtros e tela de consulta restrita a administração. |
| Sugestões de classificação | Implementado | Preenchimento assistido por histórico e por compromisso ativo. |

## Situação operacional

```text
Pronto para piloto interno: sim.
Pronto para uso assistido com dados reais: sim.
Pronto para comercialização como SaaS: ainda não.
```

O sistema deve ser usado em piloto, com backup e revisão periódica dos relatórios. O objetivo do piloto é validar fluxos reais, encontrar exceções e priorizar melhorias pelo uso, não pela imaginação.

---

# Conceitos centrais

## Account

Representa dinheiro real.

Exemplos:

- conta bancária;
- caixa físico;
- carteira;
- conta digital;
- cartão de crédito.

Transferências entre contas são movimentações patrimoniais, não receitas ou despesas operacionais.

## Fund

Representa uma destinação interna, projeto, orçamento ou centro de responsabilidade.

```text
saldo atual = saldo inicial + soma das alocações
```

Fund não representa banco nem altera saldo bancário real.

## Category

Representa a natureza da transação.

```text
INCOME
EXPENSE
TRANSFER
```

Categorias de receita e despesa podem ter hierarquia. Categoria filha deve manter o mesmo tipo da categoria pai.

## Beneficiary

Representa favorecido, fornecedor, missionário, funcionário ou responsável ligado a uma alocação.

Um compromisso mensal não pertence diretamente ao beneficiário: ele é representado por `SupportAgreement`.

---

# FinancialTransaction

Representa o lançamento financeiro oficial.

Principais campos:

```text
account
category
type
source
status
externalId
rawDescription
description
settlementDate
expectedAmount
settledAmount
attachments
allocations
importedAt
```

## Descrição original e editável

```text
rawDescription = texto recebido do banco/importador.
description = texto editável e amigável ao usuário.
```

A aplicação nunca deve substituir `rawDescription`, pois ele é necessário para conferência, auditoria, deduplicação e sugestões futuras.

## Status

| Status | Significado |
|---|---|
| `PENDING` | Lançamento pendente. |
| `SETTLED` | Lançamento liquidado/pago/recebido. |
| `CANCELED` | Cancelado logicamente; permanece no histórico. |

## Regras de pendência

```text
A classificar:
category == null
AND status != CANCELED

A alocar:
status == SETTLED
AND category != null
AND type != TRANSFER
AND ainda existe valor não alocado
```

---

# Importações e deduplicação

## OFX

Fluxo:

```text
OFX -> FinancialTransaction
```

O importador deve impedir duplicação do mesmo lançamento mesmo quando o usuário envia arquivos com períodos sobrepostos.

Regra principal:

```text
organization_id + account_id + external_id/FITID
```

Quando o identificador do banco estiver disponível, ele é a referência mais confiável para deduplicação. O comportamento esperado é:

```text
Importar Maio
↓
Importar Maio novamente
→ transações de Maio ignoradas como duplicadas

Importar Maio + Junho
→ Maio ignorado
→ apenas Junho importado
```

## Limites conhecidos

- Arquivos OFX com múltiplos extratos/contas precisam de tratamento explícito; não devem ignorar silenciosamente contas adicionais.
- OFX bancário não deve ser usado como fluxo normal de importação para contas do tipo `CREDIT_CARD`.
- Toda importação deve gerar um registro de auditoria resumido do arquivo/processo, não centenas de logs repetidos.

---

# Sugestões de classificação

## Objetivo

Reduzir cliques repetitivos sem salvar nada sem confirmação.

```text
Abrir Classificar
→ buscar histórico compatível
→ preencher tipo, categoria e alocações
→ usuário revisa
→ usuário salva
```

A configuração por organização é:

```text
autoFillClassificationSuggestions
```

Quando desligada, a sugestão não preenche o formulário.

## Histórico por rawDescription

A chave de comparação é derivada de `rawDescription`, mas a descrição original continua intacta.

Exemplo Bradesco:

```text
PIX RECEBIDO REM: PRIMEIRA IGREJA BATIS 25/05
PIX RECEBIDO REM: PRIMEIRA IGREJA BATIS 25/06
```

Para sugestão, a data ao final é removida, produzindo:

```text
PIX RECEBIDO REM: PRIMEIRA IGREJA BATIS
```

A normalização deve remover apenas data no final da frase, evitando apagar números relevantes no meio da descrição.

## Limitação atual importante

Histórico idêntico pode ter classificações diferentes:

```text
PIX ALEX -> sustento
PIX ALEX -> reembolso
```

Por isso, a sugestão é assistida e exige revisão. Evolução planejada:

```text
Histórico consistente -> aplicar automaticamente.
Histórico conflitante -> não preencher automaticamente; mostrar opções para escolha.
```

Outra evolução importante é persistir uma `suggestion_key` e consultar por:

```text
organization + account + suggestion_key
```

em vez de depender de uma janela limitada de transações recentes.

## Sugestão por compromisso

Em uma despesa, ao selecionar favorecido com `SupportAgreement` ativo, o sistema pode sugerir:

```text
fund
beneficiary
referenceMonth
amount limitado ao valor restante da transação
```

Nada é salvo automaticamente.

---

# Organização Settings

Principais opções atuais:

```text
defaultFundId
allowNegativeFunds
suggestDefaultFundReallocation
requireFiscalDocumentForExpenses
requireProofForIncomes
autoFillClassificationSuggestions
```

## Fundo padrão

```text
Sem alocação manual + fundo padrão configurado
→ backend pode alocar integralmente ao fundo padrão.

Alocação manual parcial
→ restante permanece pendente.
```

O sistema não deve esconder pendência enviando saldo restante ao fundo padrão sem ação explícita.

---

# Cartão de crédito

O fluxo de cartão é separado da importação bancária normal.

Principais elementos:

```text
CreditCardStatement
CreditCardStatementItem
```

Regras principais:

- itens da fatura podem ser classificados e documentados individualmente;
- a fatura é paga por uma account que não seja cartão;
- pagamento de fatura não deve ser tratado como despesa operacional duplicada;
- conta de cartão não deve receber importação OFX bancária comum.

---

# Auditoria

A tabela `audit_log` registra ações críticas e permite consulta administrativa.

Prioridades já registradas:

```text
FINANCIAL_TRANSACTION
TRANSACTION_ALLOCATION
ATTACHMENT
SUPPORT_AGREEMENT
ORGANIZATION_SETTINGS
OFX/CSV import
TRANSFER
CREDIT_CARD_STATEMENT
```

A tela de auditoria deve ser acessível a `OWNER` e `ADMIN`.

O log é a trilha completa; campos diretos como `created_by`, `updated_by`, `canceled_by` e `uploaded_by` continuam úteis como resumo rápido nas entidades.

---

# Relatórios implementados

| Relatório | Finalidade |
|---|---|
| Dashboard | Visão executiva de receitas, despesas, resultado, saldos e pendências. |
| Resultado por categoria | Demonstração por plano de contas e hierarquia. |
| Fundos e projetos | Saldos, entradas e saídas de destinação interna. |
| Prestação / sustento | Compromisso + recursos destinados - repasses. |
| Fluxo de caixa por conta | Saldo inicial, entradas, saídas, saldo final e evolução por conta. |
| Auditoria | Ações críticas por usuário, entidade, ação e período. |

## Excel

Implementados:

```text
Prestação/Sustento
Movimento Financeiro Liquidado
```

---

# Próxima grande feature — Dossiê de Fechamento

## Objetivo

Montar uma pasta digital/impressa de fechamento por período e conta, reunindo extrato bancário oficial, transações e documentos vinculados.

Nome de produto recomendado:

```text
Dossiê de Fechamento
ou
Pasta de Auditoria
```

## Estrutura esperada do PDF

Por conta:

```text
1. Capa da conta e período
2. Extrato bancário oficial em PDF
3. Resumo financeiro
4. Índice/lista de transações
5. Dossiês de despesas
```

Por despesa:

```text
Página-resumo da despesa
→ comprovante de pagamento
→ documento fiscal / nota / recibo
→ demais anexos
```

## Fluxo da tela

```text
Relatórios -> Dossiê de Fechamento

Selecionar:
- período;
- uma ou várias contas;
- incluir contas sem movimento;
- receitas, despesas e/ou transferências;
- ordem de organização;
- modelo de geração.
```

Antes de gerar, o sistema deve mostrar pendências:

```text
Conta Bradesco:
- extrato PDF: OK/Faltando;
- número de transações;
- despesas sem comprovante;
- despesas sem documento fiscal.
```

O usuário pode corrigir pendências ou gerar mesmo assim com aviso registrado.

## Primeira versão planejada

```text
1. Upload de extrato bancário PDF por conta e período.
2. Validação de pendências por transação.
3. Geração de PDF com capa, extrato, lista de lançamentos e anexos.
4. Ordem configurável por conta e por data.
```

A feature deve ser configurável para não prender o produto ao processo de uma única empresa:

```text
Incluir contas sem movimento
Exigir extrato PDF
Exigir comprovante de despesa
Exigir documento fiscal
Incluir receitas/despesas/transferências
Capa por conta
Termo de conferência/assinatura
```

---

# Segurança, operação e piloto

## Antes de uso oficial contínuo

- manter backup manual do PostgreSQL no Railway;
- testar restauração do backup;
- assegurar backup/recuperação dos anexos;
- validar arquivos por tipo e tamanho;
- manter secrets fora do repositório;
- revisar logs de deploy;
- testar regras financeiras e relatórios com dados reais.

## Deploy atual

O projeto está publicado no Railway. Fluxo padrão:

```text
commit
→ git push
→ Railway faz build/deploy automático
→ validar deployment como Success
→ testar a versão publicada
```

Docker não é necessário para continuar usando o Railway hoje. Ele é uma habilidade importante para portabilidade e infraestrutura futura, mas não bloqueia o piloto.

---

# Roadmap priorizado

## Agora — piloto e estabilização

- operar com dados reais;
- registrar bugs e pontos confusos;
- confirmar backup e restore;
- validar importações, relatórios, anexos, cartão e transferências;
- evitar iniciar funcionalidades grandes sem uma necessidade real confirmada.

## Próximo bloco planejado

- Dossiê de Fechamento / Pasta de Auditoria;
- upload de extrato PDF por conta/período;
- geração de PDF com anexos;
- alerta de documentação pendente.

## Depois do piloto

- melhorar sugestão por histórico conflitante;
- persistir `suggestion_key`;
- testes automatizados dos fluxos críticos;
- ajustes de auditoria de importação;
- validações adicionais de `SupportAgreement`;
- backups automatizados e storage externo.

## Preparação para venda

- onboarding de clientes;
- recuperação/troca de senha;
- convites e gestão de usuários;
- política de privacidade e retenção;
- exportação completa dos dados do cliente;
- monitoramento, alertas e backups automáticos;
- termos de uso e contrato de prestação de serviço revisados por profissional jurídico;
- planos e cobrança após maturidade operacional.
