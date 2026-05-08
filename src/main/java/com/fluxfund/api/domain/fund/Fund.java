package com.fluxfund.api.domain.fund;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fund")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Fund extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "initial_balance", nullable = false)
    private BigDecimal initialBalance = BigDecimal.ZERO;

    @Column(name = "initial_balance_date")
    private LocalDate initialBalanceDate;

    @Column(nullable = false)
    private boolean active;
}
