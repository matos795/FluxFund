# FluxFund Web

Frontend do FluxFund, aplicação SaaS de gestão financeira e prestação de contas construída com React + TypeScript.

**Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, Lucide, Axios, TanStack Query, React Hook Form, Zod e Recharts.

> **Atualizado em 21/08/2026.** O frontend está publicado, opera com dados reais e já cobre os principais fluxos financeiros, multi-tenant, relatórios, documentos, Dossiê de Fechamento e relacionamento financeiro.

---

## Objetivo da interface

A UI deve transformar uma rotina financeira complexa em um fluxo auditável e rápido:

```text
importar
→ conferir
→ classificar
→ alocar
→ documentar
→ acompanhar pendências
→ analisar relatórios
→ fechar período
```

A prioridade é clareza operacional sem esconder regras financeiras.

---

## Estado atual das principais áreas

| Área | Estado | Observação |
|---|---|---|
| Login / sessão | Implementado | JWT, recuperação de senha e convites. |
| Organização ativa | Implementado | Contexto multi-tenant e troca de organização. |
| Roles | Implementado | OWNER, ADMIN, FINANCE e VIEWER. |
| Dashboard | Implementado | Saldos, receitas, despesas, resultado, pendências e gráficos. |
| Contas | Implementado | Bancos, caixa, digital e cartão. |
| Categorias | Implementado | Hierarquia e regras documentais. |
| Fundos | Implementado | CRUD, saldo, regras de negativo e relatórios. |
| Contatos financeiros | Implementado | Origem de receita, destinatário, contato 360 e compromissos. |
| Transações | Implementado | Filtros, classificação, workspace, anexos, alocações e ações em lote. |
| Importações | Implementado | OFX/CSV, histórico de lotes e desfazer lote quando seguro. |
| Sugestões | Implementado | Histórico normalizado, compromisso, evidências e níveis de confiança. |
| Cartão | Implementado | Faturas, itens, importação, anexos e pagamento parcial. |
| Transferências | Implementado | Conta origem/destino sem duplicar resultado operacional. |
| Recibos | Implementado | Prévia, emissão, cancelamento e reemissão. |
| Biblioteca | Implementado 1.0 | Extratos, faturas de cartão e documentos já integrados; expansão planejada. |
| Dossiê de Fechamento | Implementado 2.0 | Fluxo guiado: Configuração → Documentos → Pendências → Revisão/PDF. |
| Central de Relatórios | Implementado | Relatórios agrupados por pergunta gerencial. |
| Relacionamentos Financeiros | Implementado | KPIs, gráfico mensal, concentração, rankings e confiabilidade. |
| Previsão Financeira | Implementado | Compromissos futuros planejados, separada do histórico realizado. |
| Auditoria | Implementado | Consulta administrativa de ações críticas. |

---

## Arquitetura frontend

Estrutura geral por features:

```text
src/
├── api/
├── components/
├── features/
├── hooks/
├── pages/
├── routes/
├── utils/
└── main.tsx
```

Padrões usados:

- `httpClient` centraliza Axios e contexto da organização;
- TanStack Query gerencia consultas, mutations e invalidação de cache;
- React Hook Form + Zod para formulários;
- componentes shadcn/ui para consistência visual;
- páginas devem preferir componentes pequenos por feature em vez de arquivos monolíticos;
- filtros de período usam `DateRangePresetFilter` / `DateRangeValue`;
- relatórios gerenciais podem usar Recharts quando um gráfico realmente melhora a leitura.

---

## Regras de UX importantes

### Operacional × Gerencial

Telas operacionais respondem:

```text
O que precisa ser feito agora?
```

Exemplos:

- pendências;
- compromissos a pagar/receber;
- classificação;
- contato 360.

Relatórios gerenciais respondem:

```text
Como a organização está e como evoluiu?
```

Exemplos:

- Fluxo de Caixa;
- Resultado por Categoria;
- Fundos;
- Previsão Financeira;
- Relacionamentos Financeiros.

### Cartão de crédito

- item da fatura é despesa econômica;
- pagamento da fatura é movimento de caixa/transferência;
- a UI não deve induzir dupla contabilização.

### Relacionamentos Financeiros

- receitas usam `sourceParty`;
- despesas usam destinatário/recipient party;
- gráfico usa realizado por `settlementDate`;
- compromissos entram como confiabilidade histórica, não como previsão futura;
- `0%` significa compromisso não cumprido; `—` significa que não havia compromisso avaliável.

### Dossiê

Fluxo atual:

```text
Configuração
→ Documentos
→ Pendências
→ Revisão e PDF
```

A geração permanece permissiva: pendências são avisos, não bloqueios absolutos.

---

## Próximos passos frontend antes da venda

1. integrar visualmente os fluxos necessários ao aceite de Termos/Privacidade;
2. participar da primeira pipeline CI com `npm run build` em push/PR;
3. corrigir/acompanhar a UX das exceções de cartão após regra backend definida;
4. revisar onboarding inicial para clientes.

---

## Melhorias posteriores

Não bloqueiam a primeira venda:

- Biblioteca 2.0 com Dossiês salvos, Recibos e anexos completos;
- central única de exportações PDF;
- mais gráficos nos relatórios que se beneficiem de leitura visual;
- refinamento dos CRUDs;
- filtros/ordenações extras nos relatórios apenas quando o uso real justificar;
- testes E2E de jornadas críticas.

---

## Build

```bash
npm install
npm run build
```

A futura pipeline de CI deve executar o build automaticamente em push/PR.

---

## Continuidade em outro chat

Antes de alterar uma feature, consulte:

1. `../docs/README.md` para regras e roadmap;
2. este README para padrões de frontend;
3. o código atual da `main`, que sempre prevalece sobre documentação desatualizada.
