package com.fluxfund.api.domain.report.dto.creditcardstatement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.fluxfund.api.domain.creditcardstatement.CreditCardStatementStatus;

public record CreditCardStatementReportResponse(
        UUID statementId,
        String statementName,

        String creditCardAccountName,
        String bankName,

        String paymentAccountName,

        LocalDate closingDate,
        LocalDate dueDate,
        LocalDate paymentDate,

        CreditCardStatementStatus status,

        BigDecimal previousBalanceAmount,

        BigDecimal totalAmount,
        BigDecimal paidAmount,
        BigDecimal outstandingAmount,

        long itemCount,
        long unclassifiedItemCount,

        List<CreditCardStatementCategorySummaryResponse> categoryItems,
        List<CreditCardStatementReportItemResponse> items
) {
}