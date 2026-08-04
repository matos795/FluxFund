package com.fluxfund.api.domain.receipt;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReceiptType {

    DONATION(
            ReceiptDirection
                    .RECEIVED_BY_ORGANIZATION,

            "Doação recebida"),

    MEMBER_CONTRIBUTION(
            ReceiptDirection
                    .RECEIVED_BY_ORGANIZATION,

            "Contribuição recebida"),

    CUSTOMER_PAYMENT(
            ReceiptDirection
                    .RECEIVED_BY_ORGANIZATION,

            "Pagamento recebido de cliente"),

    SPONSORSHIP(
            ReceiptDirection
                    .RECEIVED_BY_ORGANIZATION,

            "Patrocínio recebido"),

    OTHER_INCOME(
            ReceiptDirection
                    .RECEIVED_BY_ORGANIZATION,

            "Valor recebido"),

    SUPPORT_PAYMENT(
            ReceiptDirection
                    .PAID_BY_ORGANIZATION,

            "Pagamento de sustento"),

    SUPPLIER_PAYMENT(
            ReceiptDirection
                    .PAID_BY_ORGANIZATION,

            "Pagamento a fornecedor"),

    SERVICE_PAYMENT(
            ReceiptDirection
                    .PAID_BY_ORGANIZATION,

            "Pagamento por serviço"),

    REIMBURSEMENT(
            ReceiptDirection
                    .PAID_BY_ORGANIZATION,

            "Reembolso"),

    OTHER_PAYMENT(
            ReceiptDirection
                    .PAID_BY_ORGANIZATION,

            "Valor pago");

    private final ReceiptDirection direction;

    private final String defaultDescription;

    public boolean isReceivedByOrganization() {

        return direction ==
                ReceiptDirection
                        .RECEIVED_BY_ORGANIZATION;
    }

    public boolean isPaidByOrganization() {

        return direction ==
                ReceiptDirection
                        .PAID_BY_ORGANIZATION;
    }
}