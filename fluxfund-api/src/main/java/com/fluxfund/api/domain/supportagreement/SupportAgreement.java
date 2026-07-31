package com.fluxfund.api.domain.supportagreement;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.fund.Fund;
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
import jakarta.persistence.Transient;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "support_agreement")
@Getter
@Setter
@NoArgsConstructor
public class SupportAgreement
        extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_id", nullable = false)
    private Beneficiary beneficiary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fund_id", nullable = false)
    private Fund fund;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false, length = 20)
    private FinancialCommitmentDirection direction = FinancialCommitmentDirection.PAYABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "commitment_type", nullable = false, length = 40)
    private FinancialCommitmentType commitmentType = FinancialCommitmentType.SUPPORT;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence", nullable = false, length = 20)
    private FinancialCommitmentRecurrence recurrence = FinancialCommitmentRecurrence.MONTHLY;

    @Column(name = "due_day")
    private Integer dueDay;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 255)
    private String description;

    @Transient
    public Beneficiary getParty() {
        return beneficiary;
    }

    @Transient
    public void setParty(Beneficiary party) {
        this.beneficiary = party;
    }

    public SupportAgreementStatus resolveStatusAt(LocalDate referenceDate) {

        if (!Boolean.TRUE.equals(active)) {
            return SupportAgreementStatus.INACTIVE;
        }

        if (startDate.isAfter(referenceDate)) {
            return SupportAgreementStatus.SCHEDULED;
        }

        if (endDate != null && endDate.isBefore(referenceDate)) {
            return SupportAgreementStatus.EXPIRED;
        }

        return SupportAgreementStatus.ACTIVE;
    }
}