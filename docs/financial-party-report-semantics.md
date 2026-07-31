# Contatos financeiros nos relatórios

## Mapeamento físico temporário

Durante a migração do domínio:

- `transaction_allocation.source_party_id`
  representa `sourceParty`;
- `transaction_allocation.beneficiary_id`
  representa `recipientParty`;
- o nome `beneficiary` é legado e não deve ser
  interpretado como origem da receita.

## Relatórios existentes

### Relatório de fundos

Não depende de contato financeiro.

Os cálculos usam:

- fundo;
- valor da alocação;
- tipo da transação;
- status;
- período.

### Prestação de contas e sustento

Usam `recipientParty`.

Isso inclui:

- saldo anterior;
- valor destinado;
- valor transferido;
- compromisso;
- valor a pagar;
- pendência;
- agrupamento por conta;
- Dossiê de sustento.

Enquanto a entidade mantiver o nome legado,
esses relatórios continuarão consultando
`allocation.beneficiary`.

### Exportação de transações

Para receitas, o contato principal é
`sourceParty`.

Para despesas, o contato principal é
`recipientParty`.

## Relatórios futuros

### Relacionamento com doadores e clientes

Deve usar:

- somente transações `INCOME`;
- `sourceParty`;
- valor da alocação;
- competência;
- fundo;
- data da última entrada;
- frequência;
- total recebido;
- previsto x recebido.

### Compromissos a receber

O contato do compromisso deve preencher
`sourceParty`.

### Compromissos a pagar

O contato do compromisso deve preencher
`recipientParty`.

O compromisso de sustento missionário é um
tipo de compromisso a pagar.

## Renomeação definitiva

`beneficiary_id` somente poderá ser renomeado
para `recipient_party_id` depois que forem
migrados:

- consultas JPQL;
- projections;
- serviços de relatório;
- exportações Excel;
- Dossiê;
- compromissos;
- sugestões;
- frontend;
- testes de regressão.

A renomeação não deve alterar valores,
UUIDs ou relacionamentos existentes.