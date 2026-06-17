package com.fluxfund.api.domain.fundtransfer;

import java.math.BigDecimal;
import java.time.LocalDate;

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
@Table(name = "fund_transfer")
@Getter
@Setter
@NoArgsConstructor
public class FundTransfer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_fund_id", nullable = false)
    private Fund sourceFund;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_fund_id", nullable = false)
    private Fund destinationFund;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "transfer_date", nullable = false)
    private LocalDate transferDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FundTransferStatus status = FundTransferStatus.ACTIVE;
}