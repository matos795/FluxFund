/*
 * Transações bancárias continuam usando o FITID
 * como identificador único por conta.
 *
 * Itens de cartão usam o FITID dentro da fatura,
 * pois alguns bancos reutilizam o mesmo FITID
 * nas parcelas seguintes de uma compra parcelada.
 */

ALTER TABLE financial_transaction
DROP CONSTRAINT IF EXISTS
    uk_financial_transaction_ofx_external_id;


/*
 * OFX bancário comum:
 *
 * O mesmo FITID não pode ser importado duas vezes
 * na mesma conta.
 */
CREATE UNIQUE INDEX
    uk_ft_external_id_without_statement

ON financial_transaction (
    organization_id,
    account_id,
    external_id
)

WHERE external_id IS NOT NULL
  AND credit_card_statement_id IS NULL;


/*
 * Itens de fatura:
 *
 * O mesmo FITID pode aparecer em faturas diferentes,
 * mas não duas vezes dentro da mesma fatura.
 */
CREATE UNIQUE INDEX
    uk_ft_statement_external_id

ON financial_transaction (
    organization_id,
    account_id,
    credit_card_statement_id,
    external_id
)

WHERE external_id IS NOT NULL
  AND credit_card_statement_id IS NOT NULL;