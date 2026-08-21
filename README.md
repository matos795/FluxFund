# FluxFund

SaaS financeiro multi-tenant para organizações que precisam controlar contas bancárias, fundos/projetos, contatos financeiros, compromissos, documentos e prestação de contas com rastreabilidade.

**Stack principal**

- Backend: Java 21, Spring Boot, Spring Data JPA, PostgreSQL, Flyway e Spring Security/JWT.
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form e Zod.
- Infra atual: Railway para API/Web/PostgreSQL e volume de arquivos.

> **Estado em 21/08/2026:** MVP técnico avançado, publicado e já utilizado com dados reais. O núcleo financeiro, multi-tenant, relatórios, documentos, Dossiê de Fechamento e Relacionamentos Financeiros estão implementados. Antes de ampliar a venda, o foco imediato é criar uma rede mínima de testes/CI, corrigir duas exceções de cartão e implantar aceite versionado de Termos/Privacidade.

## Leia primeiro

A documentação mestre do estado funcional, regras de negócio, decisões e roadmap está em:

- [`docs/README.md`](docs/README.md) — **fonte de verdade para continuidade do projeto**.
- [`fluxfund-web/README.md`](fluxfund-web/README.md) — arquitetura e estado do frontend.

Ao continuar o projeto em outro chat, a recomendação é ler primeiro `docs/README.md` e depois consultar o código atual da `main`.

---

## O que o FluxFund já faz

- autenticação JWT, usuários, organizações e permissões por tenant;
- contas bancárias, caixas, contas digitais e cartões;
- categorias hierárquicas e fundos/projetos;
- contatos financeiros com papéis de origem de receita e destinatário de pagamento;
- importação OFX/CSV, deduplicação e histórico de lotes;
- desfazer lote de importação quando nenhuma transação do lote foi alterada;
- transações, classificação, alocações, anexos e políticas documentais;
- transferências entre contas;
- cartões de crédito, itens de fatura, importação, pagamento parcial e conciliação;
- compromissos a receber/a pagar e acordos de sustento;
- sugestões por histórico e por compromisso, com níveis de confiança;
- recibos com prévia, emissão, cancelamento e reemissão;
- Biblioteca de Documentos;
- Dossiê de Fechamento 2.0 com fluxo guiado, pendências e exportação PDF;
- Dashboard e Central de Relatórios;
- Resultado por Categoria, Fundos, Prestação/Sustento, Fluxo de Caixa, Pendências, Auditoria, Previsão Financeira e Relacionamentos Financeiros;
- exportações Excel/PDF relevantes;
- auditoria de ações críticas;
- backup do PostgreSQL e do volume de arquivos com procedimento de restore documentado/testado manualmente.

---

## Regra arquitetural central

O sistema não mistura quatro conceitos:

```text
Account        = onde o dinheiro existe de fato.
Fund           = para qual finalidade interna ele foi destinado.
Category       = qual é a natureza financeira da movimentação.
FinancialParty = de quem veio / para quem foi / com quem existe compromisso.
```

Transferências movimentam patrimônio entre contas, mas não são receita/despesa operacional.

Compras no cartão são despesas econômicas; o pagamento da fatura movimenta caixa e não deve duplicar a despesa.

---

## Próximo bloco: Venda 1.0 / Safety Net 1.0

Antes de adicionar novas features grandes, a prioridade é:

1. **Testes automatizados mínimos das regras financeiras críticas** — JUnit, testes de integração e dataset controlado.
2. **Primeira pipeline de CI** — backend tests + frontend build em push/PR.
3. **Cartão: pagamento acima do valor devido** — crédito excedente deve ser transportado de forma auditável para a próxima fatura.
4. **Nubank Pix no Crédito** — investigar o padrão real do OFX/fatura e definir se é regra de classificação ou automação específica.
5. **Termos de Uso + Política de Privacidade** — aceite explícito, versionado e registrado por usuário.
6. **Revisão final de backup/restore e onboarding** para os primeiros clientes.

A meta não é atingir cobertura total antes de vender. A meta é criar uma **rede mínima de segurança comercial** para impedir regressões financeiras graves.

---

## Melhorias posteriores que não bloqueiam a primeira venda

- persistir `suggestionKey` e refatorar a busca de sugestões históricas;
- Biblioteca 2.0: Dossiês salvos, Recibos, anexos completos e melhor navegação;
- central única de exportações PDF;
- mais gráficos nos relatórios gerenciais;
- refinamento visual e de UX dos CRUDs;
- ampliar CI/CD e testes end-to-end;
- planejamento financeiro planejado × realizado;
- assinatura digital e notificações;
- IA futura para explicar anomalias/divergências, nunca como fonte de verdade dos cálculos.

---

## Critério de prioridade

Uma melhoria visual não deve atrasar a primeira venda.

Bloqueiam venda apenas problemas que envolvam:

- valor financeiro incorreto;
- isolamento/segurança entre organizações;
- risco de perda de dados;
- fluxo essencial impossível de operar;
- requisito jurídico/comercial essencial.

Para regras detalhadas, decisões recentes e roadmap completo, consulte [`docs/README.md`](docs/README.md).
