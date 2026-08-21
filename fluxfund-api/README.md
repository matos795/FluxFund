# FluxFund API

Backend do FluxFund, responsável por regras financeiras, isolamento multi-tenant, persistência, relatórios, documentos, auditoria e integrações de importação.

**Stack:** Java 21, Spring Boot, Spring Data JPA, PostgreSQL, Flyway, Spring Security/JWT, Apache POI e geração/manipulação de PDFs.

> **Atualizado em 21/08/2026.** O backend está publicado e opera com dados reais. A próxima fase técnica é a **Safety Net 1.0**, com testes automatizados críticos e CI.

---

## Fonte de verdade

Para contexto completo de produto, regras e roadmap, leia primeiro:

```text
../docs/README.md
```

Este arquivo resume apenas arquitetura e prioridades do backend.

---

## Princípios

```text
Account        = dinheiro real.
Fund           = destinação interna.
Category       = natureza financeira.
FinancialParty = origem/destino/relacionamento.
```

Regras obrigatórias:

- dinheiro usa `BigDecimal`;
- tenant é validado no backend, nunca apenas no frontend;
- `X-Organization-Id` precisa ser acompanhado de validação do vínculo do usuário;
- transferências não são receita/despesa operacional;
- compras no cartão são despesas econômicas;
- pagamento de fatura movimenta caixa e não duplica despesa;
- `rawDescription` é preservada;
- cancelamentos importantes permanecem rastreáveis/auditáveis.

---

## Domínios principais

```text
organization
user / organization_user
account
category
fund
beneficiary / financial party
financial_transaction
transaction_allocation
attachment
financial_commitment
support_agreement
credit_card_statement
credit_card_statement_payment
bank_statement_document
receipt
closing_dossier
audit_log
import_batch
```

---

## Relatórios atuais

O backend serve relatórios de:

- Resultado por Categoria;
- Fundos;
- Prestação/Sustento;
- Fluxo de Caixa por Conta;
- Pendências;
- Compromissos a receber/pagar;
- Previsão Financeira;
- Auditoria;
- Relacionamentos Financeiros;
- Dossiê de Fechamento;
- exportações Excel/PDF.

### Relacionamentos Financeiros

Endpoint:

```text
GET /api/v1/reports/financial-relationships
```

Semântica:

```text
INCOME  + sourceParty
EXPENSE + beneficiary/recipientParty
TRANSFER excluída
```

Realizado usa `settlementDate`.

Confiabilidade de compromissos usa competência/vencimento e vínculo explícito com `financialCommitment`.

---

## Cartão de crédito

Itens de fatura são transações `EXPENSE` com source `CREDIT_CARD`.

Não entram no fluxo de caixa bancário; pagamento da fatura entra como movimento de caixa/transferência.

Pagamento parcial já é suportado.

### P0 pendente

Pagamento maior que o saldo devido deve gerar **crédito auditável para a próxima fatura**. Essa regra ainda será modelada e testada antes da Venda 1.0.

### Nubank Pix no Crédito

Existe investigação pendente para entender corretamente o padrão de múltiplas movimentações do Nubank. Não automatizar união de transações sem validar OFX e fatura reais.

---

## Importações

OFX/CSV possuem deduplicação e histórico de lotes.

Undo de lote só é permitido quando as transações importadas continuam intactas. Qualquer alteração relevante bloqueia o undo do lote.

---

## Sugestões

O sistema possui sugestões por histórico normalizado e por compromissos, com evidências e níveis de confiança.

Refatoração futura:

```text
persistir suggestionKey
```

Essa fase está adiada para depois da primeira venda e de maior cobertura de testes.

---

## Safety Net 1.0 — próximo passo

A meta não é testar tudo antes de vender. A meta é proteger regras que podem causar erro financeiro grave.

Primeiros cenários:

```text
receita altera caixa corretamente
despesa altera caixa corretamente
transferência não altera patrimônio consolidado
item de cartão não movimenta banco
pagamento de fatura movimenta banco uma única vez
pagamento parcial mantém saldo correto
futuro crédito excedente da fatura
saldos de fundos fecham
relacionamentos: soma mensal = total
relacionamentos: soma dos contatos = total relacionado
compromissos: excedente não mascara pendência
isolamento entre organizações
```

Plano:

```text
T1 JUnit básico
T2 testes críticos
T3 dataset controlado
T4 invariantes/reconciliação
T5 Testcontainers/PostgreSQL temporário
T6 GitHub Actions CI
T7 CD somente depois
```

---

## Comandos atuais

Rodar testes/build backend:

```powershell
.\mvnw.cmd clean test
```

Empacotar sem testes, apenas quando houver motivo específico:

```powershell
.\mvnw.cmd package -DskipTests
```

A futura CI deverá executar `clean test` automaticamente em push/PR.

---

## Banco e migrations

PostgreSQL é versionado por Flyway.

Nunca editar manualmente migration que já foi aplicada em ambiente compartilhado/produção; criar nova migration incremental.

Restore de backup deve ser testado em banco separado.

---

## Continuidade

Antes de implementar regra nova:

1. leia `../docs/README.md`;
2. confira entidades/services/repositories atuais na `main`;
3. identifique se a mudança altera caixa, resultado, fundos, compromissos ou tenant;
4. quando a Safety Net existir, crie/ajuste teste antes do merge.
