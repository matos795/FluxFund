package com.fluxfund.api.domain.creditcardstatement.service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.webcohesion.ofx4j.domain.data.common.Transaction;
import com.webcohesion.ofx4j.domain.data.common.TransactionType;

@Component
public class CreditCardOfxEntryClassifier {

    public CreditCardOfxEntryType classify(
            Transaction transaction,
            String description) {

        BigDecimal amount = transaction.getBigDecimalAmount();

        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) == 0) {

            return CreditCardOfxEntryType.REVIEW_REQUIRED;
        }

        TransactionType transactionType = transaction.getTransactionType();

        String normalizedDescription = normalize(description);

        /*
         * Em uma fatura de cartão:
         *
         * valor negativo = compra, tarifa ou encargo;
         * valor positivo = pagamento, estorno ou ajuste.
         *
         * Alguns bancos usam TRNTYPE=PAYMENT também
         * para compras feitas em estabelecimentos.
         * Por isso o sinal deve ter prioridade sobre
         * o tipo informado no OFX.
         */
        if (amount.compareTo(BigDecimal.ZERO) < 0) {

            return CreditCardOfxEntryType.EXPENSE;
        }

        boolean paymentDescription = containsPaymentDescription(
                normalizedDescription);

        /*
         * Neste ponto o valor já é obrigatoriamente
         * positivo.
         */
        if (transactionType == TransactionType.PAYMENT) {

            return CreditCardOfxEntryType.PAYMENT;
        }

        if (paymentDescription) {

            return CreditCardOfxEntryType.PAYMENT;
        }

        /*
         * Alguns arquivos podem representar uma compra
         * positiva usando um tipo explicitamente de débito.
         */
        if (isDebitType(transactionType)) {

            return CreditCardOfxEntryType.EXPENSE;
        }

        /*
         * Crédito positivo desconhecido pode ser:
         *
         * - estorno;
         * - cashback;
         * - ajuste;
         * - pagamento com descrição incomum.
         *
         * Não deve virar pagamento automaticamente.
         */
        return CreditCardOfxEntryType.REVIEW_REQUIRED;
    }

    private boolean isDebitType(
            TransactionType transactionType) {

        if (transactionType == null) {
            return false;
        }

        return switch (transactionType.name()) {

            case "DEBIT",
                    "POS",
                    "FEE",
                    "SRVCHG",
                    "OUT",
                    "DIRECTDEBIT" ->
                true;

            default -> false;
        };
    }

    private boolean containsPaymentDescription(
            String description) {

        return description.contains("pagamento recebido")
                || description.contains("pagamento de fatura")
                || description.contains("pagamento da fatura")
                || description.contains("pagamento antecipado")
                || description.contains("pagamento automatico");
    }

    private String normalize(String value) {

        if (value == null) {
            return "";
        }

        return Normalizer
                .normalize(
                        value,
                        Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}