package com.fluxfund.api.domain.beneficiary;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "beneficiary",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_beneficiary_organization_name",
            columnNames = {"organization_id", "name"}
        ),
        @UniqueConstraint(
            name = "uk_beneficiary_organization_document",
            columnNames = {"organization_id", "document"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Beneficiary extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BeneficiaryType type;

    private String document;
    private String email;
    private String phone;

    @Column(nullable = false)
    private boolean active;
}
