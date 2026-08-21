# FluxFund — Contexto Mestre do Projeto

Sistema SaaS financeiro multi-tenant para organizações que precisam controlar movimentação bancária, destinação interna de recursos, relacionamentos financeiros, compromissos, documentos, prestação de contas e fechamento mensal com rastreabilidade.

**Backend:** Java 21, Spring Boot, Spring Data JPA, PostgreSQL, Flyway, Spring Security/JWT, Apache POI e geração de PDF.

**Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod e Recharts.

**Infra atual:** Railway para API/Web/PostgreSQL e volume de arquivos. Backup de banco e storage possui procedimento próprio.

> **Atualizado em 21/08/2026. Este arquivo é a fonte de verdade de continuidade do FluxFund.** Ao iniciar outro chat, leia este documento antes de propor mudanças e depois confira o código atual da `main`.

---

# 1. Estado do produto

O FluxFund já ultrapassou a fase de protótipo. O sistema está publicado, multi-tenant, possui autenticação e permissões e já é utilizado com dados reais em organizações de piloto.

Situação atual:

```text
MVP financeiro central: concluído.
Uso assistido com dados reais: sim.
Multi-tenant e permissões: sim.
Dossiê de Fechamento: concluído 2.0.
Biblioteca de Documentos: 1.0 concluída.
Relacionamentos Financeiros: concluído.
Primeiros clientes comerciais: próximo objetivo.
```

O foco não deve voltar para expansão indiscriminada de funcionalidades. A prioridade é **Venda 1.0 + Safety Net 1.0**: proteger cálculos críticos, corrigir exceções financeiras conhecidas, formalizar aceite jurídico e manter operação/backup confiáveis.

---

# 2. Regra central de arquitetura financeira

O sistema separa conceitos que não podem ser misturados:

```text
Account        = onde o dinheiro existe de fato.
Fund           = para qual finalidade interna o dinheiro foi destinado.
Category       = natureza/classificação da movimentação.
FinancialParty = de quem veio / para quem foi / com quem existe compromisso.
```

## Account

Representa dinheiro real ou obrigação financeira real.

Exemplos: conta bancária, caixa, conta digital, carteira e cartão de crédito.

Transferências entre contas são movimentações patrimoniais, não receitas/despesas operacionais.

## Fund

Representa destinação interna, projeto, orçamento ou finalidade.

```text
saldo do fundo = saldo inicial + soma das alocações
```

Fund não é banco e não substitui Account.

## Category

Representa a natureza da receita/despesa. Categorias podem ter hierarquia pai/filha; filha deve manter o tipo da categoria pai.

## FinancialParty / Beneficiary

A entidade histórica continua chamada `Beneficiary` em partes do backend, mas o produto evoluiu para o conceito de **Contato Financeiro / Financial Party**.

Um contato pode exercer múltiplos papéis:

```text
INCOME_SOURCE
PAYMENT_RECIPIENT
```

Na alocação:

```text
sourceParty    = de quem veio o recurso.
beneficiary    = destinatário/recipientParty persistido.
recipientParty = semântica do destinatário; em alguns pontos é alias/transient.
```

JPQL deve usar o campo persistido `allocation.beneficiary`, não um getter transient.

---

# 3. Multi-tenant, autenticação e permissões

Fluxo:

```text
login
→ JWT identifica app_user
→ frontend informa organização ativa
→ request envia X-Organization-Id
→ backend valida organization_user
→ role autoriza a ação
→ consulta é restringida ao tenant
```

Roles atuais:

```text
OWNER
ADMIN
FINANCE
VIEWER
```

O header `X-Organization-Id` nunca é confiança suficiente por si só. O backend precisa validar acesso em toda operação.

---

# 4. Funcionalidades implementadas

| Área | Estado | Observação |
|---|---|---|
| Login/JWT | Implementado | Login, logout, recuperação de senha e proteção de rotas. |
| Organizações | Implementado | Multi-tenant, organização ativa e isolamento backend. |
| Usuários/permissões | Implementado | Convites, vínculo com organização e roles. |
| Perfil da organização | Implementado | Razão social, CNPJ, endereço, logo, rodapé e dados usados em documentos. |
| Accounts | Implementado | Bancos, caixa, digital, carteira e cartão. |
| Categories | Implementado | Hierarquia e políticas documentais. |
| Funds | Implementado | Saldo calculado, negativo configurável e sugestão de remanejamento. |
| Contatos financeiros | Implementado | Cadastro, papéis, origem/destino e visão 360. |
| Financial Transactions | Implementado | Receita, despesa, transferência, classificação, cancelamento, filtros e exportações. |
| Transaction Allocations | Implementado | Fundo, sourceParty, recipientParty, competência e compromisso. |
| Attachments | Implementado | Upload, download, exclusão, comprovantes e documentos fiscais. |
| OFX | Implementado | Importação bancária e deduplicação por identificador quando disponível. |
| CSV | Implementado | Mercado Pago e outros fluxos tratados. |
| Import Batches | Implementado | Histórico de importação e undo seguro de lote. |
| Cartão de crédito | Implementado | Faturas, itens, importação CSV, classificação, anexos e pagamento parcial. |
| Transferências | Implementado | Movem caixa entre contas sem alterar resultado operacional. |
| Dashboard | Implementado | Saldos, receitas, despesas, resultado, pendências e gráficos. |
| Compromissos financeiros | Implementado | A receber/a pagar, recorrência, vigência e reconciliação. |
| SupportAgreement | Implementado | Sustento com períodos/valores variáveis e competência. |
| Sugestões automáticas | Implementado | Histórico normalizado, compromisso, níveis de confiança e evidências. |
| Recibos | Implementado | Rascunho, prévia, emissão, cancelamento e reemissão. |
| Auditoria | Implementado | AuditLog e tela de consulta. |
| Biblioteca de Documentos | Implementado 1.0 | Extratos/faturas e documentos centralizados; expansão planejada. |
| Dossiê de Fechamento | Implementado 2.0 | Fluxo guiado e PDF consolidado com documentos/anexos. |
| Relatórios | Implementado | Central gerencial e relatórios operacionais/gerenciais. |
| Excel/PDF | Implementado | Diversas exportações e PDFs individuais. |
| Backup/restore | Implementado operacionalmente | pg_dump + backup de storage e procedimento de restauração. |

---

# 5. FinancialTransaction

Representa o lançamento financeiro oficial.

Tipos:

```text
INCOME
EXPENSE
TRANSFER
```

Status principais:

```text
PENDING
SETTLED
CANCELED
```

## rawDescription × description

```text
rawDescription = texto bruto original do banco/importador.
description    = descrição editável pelo usuário.
```

`rawDescription` deve permanecer intacto para rastreabilidade, deduplicação e sugestão por histórico.

---

# 6. Importações e lotes

## OFX bancário

```text
arquivo OFX
→ transações financeiras importadas
→ classificação/conferência
→ alocação/documentação
```

Deduplicação usa identificador externo/FITID quando disponível e considera tenant + conta. Importações com períodos sobrepostos não devem duplicar lançamentos.

## CSV

Há importação para formatos que não oferecem OFX, como Mercado Pago, e fluxos específicos de cartão.

## ImportBatch / Undo

```text
lote importado
+ nenhuma transação do lote foi alterada
→ pode desfazer o lote

qualquer transação foi classificada/editada/alocada/documentada etc.
→ desfazer lote inteiro é bloqueado
```

Depois do undo, reimportar o mesmo arquivo deve ser permitido.

---

# 7. Sugestões de classificação

Fontes atuais:

```text
histórico por descrição normalizada
compromisso financeiro
preenchimento coletivo explícito
```

Sugestões possuem evidências e níveis de confiança. Sugestões de alta confiança podem preencher automaticamente quando a organização permite, mas o usuário continua responsável pela confirmação/salvamento.

## Pendência técnica adiada — Fase 6B.2

Persistir `suggestionKey`.

Objetivo futuro:

```text
organization + account + suggestionKey
```

em vez de depender apenas de busca em janela de histórico recente.

**Prioridade:** pós-venda/refatoração técnica. O comportamento atual já funciona e deve permanecer até termos boa cobertura de testes e feedback real.

---

# 8. Cartão de crédito

## Regra econômica

Itens de fatura são `FinancialTransaction` do tipo `EXPENSE`, source `CREDIT_CARD`, com data econômica da compra.

Eles afetam resultado por categoria, fundos/alocações, destinatários/relacionamentos e documentação.

Eles **não devem movimentar caixa bancário**.

Pagamento da fatura:

```text
conta bancária pagadora
→ transferência/saída de caixa
→ cartão/fatura
```

O pagamento não deve gerar segunda despesa operacional. Pagamento parcial já é suportado.

## Pendência crítica antes da venda — pagamento excedente

```text
Fatura = R$ 1.000
Pagamento = R$ 1.100
```

O excedente não pode desaparecer. Deve virar crédito auditável para a fatura seguinte.

A regra ainda precisa ser modelada corretamente. Não implementar apenas diminuindo silenciosamente o total da próxima fatura; a origem do crédito precisa ficar rastreável.

**Prioridade: P0 antes da Venda 1.0.**

## Investigação — Nubank Pix no Crédito

Padrão observado no extrato Nubank:

```text
Valor adicionado na conta por cartão de crédito - Valor adicionado para Pix no Crédito
```

O banco pode representar a operação em fatos distintos:

1. entrada do valor financiado/adicionado à conta;
2. saída do Pix para o destinatário;
3. taxa/custo de crédito refletido separadamente ou na fatura.

Antes de tratar como bug, analisar OFX/fatura real e confirmar a semântica.

Possíveis resultados: orientar classificação, reconhecer automaticamente o padrão ou corrigir importação se houver duplicação artificial.

**Não unir transações automaticamente sem prova de que representam o mesmo fato.**

---

# 9. Compromissos financeiros

Direções:

```text
RECEIVABLE
PAYABLE
```

Possuem contato, fundo/destinação quando aplicável, recorrência, valor, vencimento, início/fim e status ativo.

A realização é ligada via `TransactionAllocation.financialCommitment` + competência (`referenceMonth`).

Para receber, o contato preenche `sourceParty`. Para pagar, preenche destinatário (`beneficiary`/recipientParty).

Comparações de compromisso usam competência/referenceMonth. Relatórios históricos de caixa/relacionamentos usam `settlementDate` quando a pergunta é quando o dinheiro realmente entrou/saiu.

---

# 10. Recibos

Fluxo implementado:

```text
criar rascunho
→ prévia textual/PDF
→ emitir
→ cancelar/reemitir quando necessário
```

Pode existir recibo da transação inteira ou de alocação específica. Backend continua sendo fonte oficial do PDF e do valor por extenso.

---

# 11. Biblioteca de Documentos

Biblioteca 1.0 já implementada.

Direção de navegação:

```text
Extratos
Faturas de cartão
Anexos
Recibos
Dossiês
```

## Biblioteca 2.0 — pós-venda

- Dossiês gerados salvos/acessíveis;
- Recibos centralizados;
- anexos completos em visão documental;
- melhor navegação/filtros;
- central de exportação dos PDFs existentes no sistema.

Essas melhorias são importantes de UX, mas **não bloqueiam a primeira venda**.

---

# 12. Dossiê de Fechamento 2.0

Implementado e integrado aos dados reais.

Fluxo guiado:

```text
1. Configuração
2. Documentos
3. Pendências
4. Revisão e PDF
```

Configuração inclui período, contas e relatórios automáticos.

Documentos podem incluir extratos bancários oficiais, PDFs de faturas de cartão e documentos extras (Cielo, aplicações, outros etc.).

Pendências incluem conta sem extrato, despesas sem comprovante/documento fiscal, faturas sem PDF e itens de cartão pendentes quando aplicável.

A geração do PDF é **permissiva**: pendências geram avisos, mas não bloqueiam obrigatoriamente a exportação.

Estrutura do PDF consolidado contempla capa geral, resumo, seções por banco, extrato, despesas, categorias, fundos, sustento e documentos adicionais conforme configuração.

---

# 13. Relatórios

A Central de Relatórios é organizada pela pergunta que o usuário quer responder.

## Resultado por Categoria

```text
Com o que recebemos/gastamos e qual foi o resultado?
```

## Fluxo de Caixa por Conta

```text
Quanto havia, o que entrou/saiu e quanto ficou nas contas reais?
```

Transferências são consideradas por conta. Itens econômicos de cartão não movimentam caixa bancário; pagamento da fatura movimenta.

## Fundos e Projetos

```text
Quanto existe destinado a cada finalidade?
```

## Previsão Financeira

```text
O que esperamos que aconteça no futuro?
```

Usa compromissos planejados e não substitui caixa realizado.

## Relacionamentos Financeiros — concluído em 21/08/2026

```text
De quem vêm os recursos, para quem são destinados e como a carteira evolui?
```

É relatório executivo, não tela operacional de pendências.

Principais dados:

- total recebido de contatos identificados;
- total pago a destinatários identificados;
- fontes/destinatários/relacionamentos únicos;
- concentração Top 5;
- evolução mensal;
- meses ativos e primeira/última movimentação;
- rankings de fontes e destinatários;
- drill-down para Contato 360;
- confiabilidade histórica dos compromissos a receber.

Semântica:

```text
INCOME  → sourceParty
EXPENSE → beneficiary/recipientParty
TRANSFER → excluída
```

Realizado usa `settlementDate`.

Confiabilidade do compromisso usa competência/dueDate e realização vinculada.

```text
coveredExpected = min(expected, realized)
```

Assim excedente em um compromisso não mascara outro não cumprido.

No frontend:

```text
0% = havia compromisso avaliável e nada foi cumprido.
—  = não havia compromisso avaliável.
```

## Operacionais

- Compromissos a receber;
- Compromissos a pagar;
- Prestação/Sustento;
- Pendências operacionais;
- Auditoria;
- Contato 360.

Princípio:

> Relatórios gerenciais mostram o estado/evolução da organização. Telas operacionais mostram o que precisa ser feito.

---

# 14. Auditoria

`AuditLog` registra ações críticas em transações, alocações, anexos, compromissos, configurações, importações, transferências, cartão e operações documentais importantes.

Auditoria não substitui backup.

---

# 15. Backup e restore

PostgreSQL no Railway + storage persistente.

Procedimento manual inclui:

```text
PostgreSQL → pg_dump
Storage    → cópia/compactação via volume/SSH
```

Script existente:

```text
backup-fluxfund.ps1
```

Restore deve ser ensaiado periodicamente.

```text
backup não testado ≠ recuperação garantida
```

Antes de ampliar clientes, repetir restore completo em ambiente separado é desejável.

---

# 16. Deploy atual

Railway hospeda API, frontend, PostgreSQL e storage.

```text
git push
→ Railway build/deploy
→ validar deployment
→ testar versão publicada
```

Até 21/08/2026 ainda não há pipeline CI completa no GitHub executando automaticamente a rede de testes antes do deploy.

---

# 17. Safety Net 1.0 — PRÓXIMO GRANDE PASSO

O projeto cresceu a ponto de conferência manual de valores não ser suficiente. Valores reais passam de dezenas/centenas de milhares e possuem centavos, além de múltiplos relatórios derivados.

Objetivo:

> criar proteção automática suficiente para vender sem transformar testes em um projeto interminável.

## T1 — fundamentos

Aprender JUnit do zero:

```text
@Test
Arrange
Act
Assert
esperado × obtido
```

## T2 — cenários financeiros críticos

Prioridades iniciais:

1. receita liquidada altera caixa corretamente;
2. despesa liquidada altera caixa corretamente;
3. transferência altera as contas, mas não patrimônio total;
4. item de cartão é despesa econômica e não altera caixa bancário;
5. pagamento da fatura altera caixa uma vez;
6. pagamento parcial mantém saldo restante;
7. pagamento excedente gera crédito corretamente após regra ser implementada;
8. fundos fecham com suas alocações;
9. soma mensal de Relacionamentos = total do período;
10. soma dos rankings de Relacionamentos = total relacionado;
11. compromissos excedentes não compensam pendências de outros;
12. organização A nunca aparece em relatório da organização B.

## T3 — dataset controlado

Criar organização/dados de teste com valores conhecidos e centavos.

```text
Receita João       1.000,17
Receita Maria        750,32
Despesa fornecedor   420,11
Transferência         300,00
Compra no cartão      123,45
```

## T4 — invariantes/reconciliação

```text
soma dos meses = total do período
soma das participações <= 100%
coveredExpected <= expectedDue
transferência não muda patrimônio consolidado
pagamento de cartão não duplica despesa
```

## T5 — PostgreSQL real de teste

Avaliar Testcontainers:

```text
teste começa
→ PostgreSQL temporário
→ Flyway roda migrations
→ seed controlada
→ executa service/repository
→ assertions
→ container descartado
```

## T6 — CI

GitHub Actions em push/PR:

```text
Backend
Java 21
→ Maven clean test

Frontend
Node
→ npm ci
→ npm run build
```

Falha deve deixar PR vermelho.

## T7 — CD depois

Somente depois de CI confiável discutir deploy condicionado aos testes.

A meta antes da venda não é 100% de cobertura; é uma rede mínima contra regressões graves.

---

# 18. IA na validação financeira

IA não deve ser fonte de verdade dos cálculos.

```text
Testes determinísticos / SQL / invariantes
→ detectam SE há divergência.

IA futura
→ ajuda a explicar POR QUE há divergência.
```

Exemplo futuro: explicar quais transações/alocações justificam uma diferença entre relatórios.

---

# 19. Jurídico/comercial antes da venda

## Termos e Privacidade — P0

Precisa existir aceite explícito e versionado.

Modelo técnico desejado:

```text
UserLegalAcceptance
id
userId
termsVersion
privacyVersion
acceptedAt
```

Fluxo:

```text
primeiro acesso
→ mostrar Termos de Uso + Política de Privacidade
→ checkbox explícito
→ registrar versões + timestamp
→ liberar uso
```

Se versão mudar, solicitar novo aceite quando necessário.

Não usar consentimento genérico para todas as bases legais da LGPD. Textos jurídicos devem ser revisados por profissional adequado.

## Preparação comercial

- formalizar pessoa jurídica/CNPJ e enquadramento com contador;
- contrato SaaS;
- Termos de Uso;
- Política de Privacidade;
- DPA quando aplicável;
- canal de atendimento aos titulares;
- política de retenção/cancelamento/exportação;
- fornecedores/subprocessadores documentados;
- suporte e onboarding mínimos.

---

# 20. Roadmap priorizado a partir de 21/08/2026

## P0 — antes da Venda 1.0

1. **Safety Net 1.0** — JUnit, testes críticos, dataset, invariantes e primeira CI.
2. **Cartão: crédito por pagamento excedente** — modelar, transportar e testar.
3. **Nubank Pix no Crédito** — analisar caso real e definir semântica.
4. **Aceite jurídico** — Termos, Privacidade, versionamento e persistência.
5. **Operação inicial** — restore completo, onboarding e suporte.

## P1 — após primeiros clientes / conforme necessidade

- salvar Dossiês gerados na Biblioteca;
- consolidar Recibos e anexos na Biblioteca;
- central de exportações PDF;
- ajustes descobertos pelo uso real.

## P2 — melhoria de produto

- mais gráficos nos relatórios gerenciais;
- refinar CRUDs e densidade visual;
- revisão ampla de data visualization;
- planejamento financeiro planejado × realizado;
- notificações.

## P3 — refatorações/automação futura

- persistir `suggestionKey`;
- automação coletiva de alta confiança;
- IA para explicação de divergências/documentos;
- assinatura digital;
- CI/CD mais avançado;
- testes E2E amplos.

---

# 21. Regra de priorização para não atrasar vendas

> **Melhoria visual não bloqueia a primeira venda.**

Bloqueiam venda apenas problemas relacionados a:

```text
valor financeiro incorreto
isolamento/segurança entre organizações
risco de perda de dados
fluxo essencial impossível de operar
requisito jurídico/comercial essencial
```

Todo o resto compete por prioridade com feedback real de clientes.

---

# 22. Comandos de validação atuais

Backend:

```powershell
cd fluxfund-api
.\mvnw.cmd clean test
```

Frontend:

```powershell
cd fluxfund-web
npm run build
```

Enquanto CI não existir, executar antes de merges importantes.

---

# 23. Como retomar em outro chat

Mensagem recomendada:

```text
Estou continuando o FluxFund.
Leia primeiro docs/README.md da main e analise o código atual antes de sugerir alterações.
Quero ajuda passo a passo e explicação do motivo das decisões, não apenas código pronto.
```

Ordem atual:

```text
Safety Net 1.0
→ cartão: crédito excedente
→ Nubank Pix no Crédito
→ Termos/Privacidade + aceite versionado
→ Venda 1.0
```

Bug financeiro crítico pode interromper essa ordem.

---

# 24. Princípios de desenvolvimento

- backend é fonte de verdade das regras financeiras;
- frontend não deve esconder inconsistência de backend;
- dinheiro usa `BigDecimal` no backend;
- tenant sempre validado no backend;
- não duplicar conceitos só para facilitar uma tela;
- não automatizar classificação quando evidência é ambígua;
- preservar `rawDescription`;
- evitar feature creep antes da primeira venda;
- commits pequenos e testáveis;
- aprender a implementação, não apenas copiar código;
- após cada bloco: testar, commit, push, revisar e só então mergear.
