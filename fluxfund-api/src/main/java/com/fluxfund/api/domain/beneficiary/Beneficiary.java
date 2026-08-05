package com.fluxfund.api.domain.beneficiary;

import java.util.HashSet;
import java.util.Set;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "beneficiary", uniqueConstraints = {
        @UniqueConstraint(name = "uk_beneficiary_organization_document", columnNames = {
                "organization_id",
                "document"
        })
})
@Getter
@Setter
@NoArgsConstructor
public class Beneficiary extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false, length = 255)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BeneficiaryType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "party_type", nullable = false, length = 30)
    private FinancialPartyType partyType = FinancialPartyType.INDIVIDUAL;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "beneficiary_role", joinColumns = @JoinColumn(name = "beneficiary_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 40)
    private Set<FinancialPartyRole> roles = new HashSet<>();

    @Column(length = 50)
    private String document;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(name = "legal_name", length = 255)
    private String legalName;

    @Column(name = "contact_person", length = 255)
    private String contactPerson;

    @Column(name = "address_line", length = 255)
    private String addressLine;

    @Column(name = "address_number", length = 50)
    private String addressNumber;

    @Column(name = "address_complement", length = 255)
    private String addressComplement;

    @Column(length = 255)
    private String neighborhood;

    @Column(length = 255)
    private String city;

    @Column(length = 2)
    private String state;

    @Column(name = "zip_code", length = 8)
    private String zipCode;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private boolean active = true;
}