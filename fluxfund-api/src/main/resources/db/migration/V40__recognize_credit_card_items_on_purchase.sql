/*
 * Itens de cartão representam compras já efetivadas.
 *
 * O pagamento da fatura permanece controlado por
 * credit_card_statement_payment e pela transferência
 * de saída da conta pagadora.
 */
UPDATE financial_transaction transaction
SET
    account_id = statement.credit_card_account_id,

    status = 'SETTLED',

    settlement_date = COALESCE(
        transaction.purchase_date,
        transaction.settlement_date,
        transaction.due_date
    ),

    settled_amount = COALESCE(
        transaction.settled_amount,
        transaction.expected_amount
    ),

    interest_amount = COALESCE(
        transaction.interest_amount,
        0
    ),

    discount_amount = COALESCE(
        transaction.discount_amount,
        0
    ),

    updated_at = NOW()

FROM credit_card_statement statement

WHERE statement.id =
        transaction.credit_card_statement_id

  AND statement.organization_id =
        transaction.organization_id

  AND transaction.source =
        'CREDIT_CARD'

  AND transaction.status =
        'PENDING';