package com.fluxfund.api.domain.financialcommitment;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
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

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "financial_commitment")
@Getter
@Setter
@NoArgsConstructor
public class FinancialCommitment
        extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "organization_id",
            nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "party_id",
            nullable = false)
    private Beneficiary party;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name =
                "designated_recipient_party_id")
    private Beneficiary
            designatedRecipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "fund_id",
            nullable = false)
    private Fund fund;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "direction",
            nullable = false,
            length = 20)
    private FinancialCommitmentDirection
            direction;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "commitment_type",
            nullable = false,
            length = 40)
    private FinancialCommitmentType
            commitmentType;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "recurrence",
            nullable = false,
            length = 20)
    private FinancialCommitmentRecurrence
            recurrence;

    @Column(
            nullable = false,
            precision = 19,
            scale = 2)
    private BigDecimal amount;

    @Column(name = "due_day")
    private Integer dueDay;

    @Column(
            name = "start_date",
            nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 255)
    private String description;

    public FinancialCommitmentStatus
            resolveStatusAt(
                    LocalDate referenceDate) {

        if (!Boolean.TRUE.equals(active)) {
            return FinancialCommitmentStatus
                    .INACTIVE;
        }

        if (startDate.isAfter(
                referenceDate)) {

            return FinancialCommitmentStatus
                    .SCHEDULED;
        }

        if (endDate != null
                && endDate.isBefore(
                        referenceDate)) {

            return FinancialCommitmentStatus
                    .EXPIRED;
        }

        return FinancialCommitmentStatus
                .ACTIVE;
    }
}