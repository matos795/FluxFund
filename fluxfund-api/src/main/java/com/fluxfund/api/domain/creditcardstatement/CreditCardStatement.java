package com.fluxfund.api.domain.creditcardstatement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "credit_card_statement")
@Getter
@Setter
@NoArgsConstructor
public class CreditCardStatement extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_account_id", nullable = false)
    private Account creditCardAccount;

    @Column(nullable = false)
    private String name;

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CreditCardStatementStatus status = CreditCardStatementStatus.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_account_id")
    private Account paymentAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_transaction_id")
    private FinancialTransaction paymentTransaction;

    @Column(name = "statement_pdf_original_filename")
    private String statementPdfOriginalFilename;

    @Column(name = "statement_pdf_content_type")
    private String statementPdfContentType;

    @Column(name = "statement_pdf_size_bytes")
    private Long statementPdfSizeBytes;

    @Column(name = "statement_pdf_storage_key")
    private String statementPdfStorageKey;

    @Column(name = "statement_pdf_uploaded_at")
    private OffsetDateTime statementPdfUploadedAt;

    @Column(name = "previous_balance_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal previousBalanceAmount = BigDecimal.ZERO;
}