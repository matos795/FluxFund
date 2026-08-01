package com.fluxfund.api.domain.transactionallocation;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "transaction_allocation")
@Getter
@Setter
@NoArgsConstructor
public class TransactionAllocation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_transaction_id", nullable = false)
    private FinancialTransaction financialTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_id", nullable = false)
    private Fund fund;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_id")
    private Beneficiary beneficiary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_party_id")
    private Beneficiary sourceParty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_commitment_id")
    private FinancialCommitment financialCommitment;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "reference_month")
    private LocalDate referenceMonth;

    @Transient
    public Beneficiary getRecipientParty() {
        return beneficiary;
    }

    @Transient
    public void setRecipientParty(Beneficiary recipientParty) {
        this.beneficiary = recipientParty;
    }
}