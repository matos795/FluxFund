package com.fluxfund.api.domain.organization;

import java.time.OffsetDateTime;

import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "organization")
@Getter
@Setter
@NoArgsConstructor
public class Organization extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(name = "legal_name")
    private String legalName;

    @Column(name = "cnpj", length = 14)
    private String cnpj;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "address_line")
    private String addressLine;

    @Column(name = "address_number")
    private String addressNumber;

    @Column(name = "address_complement")
    private String addressComplement;

    @Column(name = "neighborhood")
    private String neighborhood;

    @Column(name = "city")
    private String city;

    @Column(name = "state", length = 2)
    private String state;

    @Column(name = "zip_code", length = 8)
    private String zipCode;

    @Column(name = "reviewer_name")
    private String reviewerName;

    @Column(name = "reviewer_title")
    private String reviewerTitle;

    @Column(name = "approver_name")
    private String approverName;

    @Column(name = "approver_title")
    private String approverTitle;

    @Column(name = "logo_original_filename")
    private String logoOriginalFilename;

    @Column(name = "logo_content_type")
    private String logoContentType;

    @Column(name = "logo_size_bytes")
    private Long logoSizeBytes;

    @Column(name = "logo_storage_key")
    private String logoStorageKey;

    @Column(name = "logo_uploaded_at")
    private OffsetDateTime logoUploadedAt;

    @Column(nullable = false)
    private boolean active = true;
}
