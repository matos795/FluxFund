package com.fluxfund.api.domain.creditcardstatement;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.account.Account;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "credit_card_statement_payment")
@Getter
@Setter
@NoArgsConstructor
public class CreditCardStatementPayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_statement_id", nullable = false)
    private CreditCardStatement statement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_account_id")
    private Account paymentAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_transaction_id")
    private FinancialTransaction paymentTransaction;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "statement_external_id")
    private String statementExternalId;

    @Column(name = "statement_raw_description", columnDefinition = "TEXT")
    private String statementRawDescription;

    @Column(name = "statement_transaction_type")
    private String statementTransactionType;

    @Column(name = "opening_balance", nullable = false)
    private boolean openingBalance;
}