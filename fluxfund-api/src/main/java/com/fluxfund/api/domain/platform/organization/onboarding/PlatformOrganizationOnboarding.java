package com.fluxfund.api.domain.platform.organization.onboarding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name =
                "platform_organization_onboarding",

        uniqueConstraints = {
                @UniqueConstraint(
                        name =
                                "uk_platform_onboarding_organization",

                        columnNames =
                                "organization_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class PlatformOrganizationOnboarding
        extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "organization_id",
            nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 40)
    private PlatformOrganizationOnboardingStatus
            status =
                    PlatformOrganizationOnboardingStatus
                            .PREPARING;

    @Column(
            name = "plan_name",
            length = 100)
    private String planName;

    @Column(
            name = "monthly_fee",
            precision = 19,
            scale = 2)
    private BigDecimal monthlyFee;

    @Column(
            name = "setup_fee",
            precision = 19,
            scale = 2)
    private BigDecimal setupFee;

    @Column(name = "contract_start_date")
    private LocalDate contractStartDate;

    @Column(name = "billing_due_day")
    private Integer billingDueDay;

    @Column(
            name = "contract_signed",
            nullable = false)
    private boolean contractSigned;

    @Column(
            name = "categories_reviewed",
            nullable = false)
    private boolean categoriesReviewed;

    @Column(
            name = "documentation_rules_reviewed",
            nullable = false)
    private boolean documentationRulesReviewed;

    @Column(
            name = "initial_import_validated",
            nullable = false)
    private boolean initialImportValidated;

    @Column(
            name = "test_report_validated",
            nullable = false)
    private boolean testReportValidated;

    @Column(
            name = "users_trained",
            nullable = false)
    private boolean usersTrained;

    @Column(
            name = "initial_backup_confirmed",
            nullable = false)
    private boolean initialBackupConfirmed;

    @Column(
            name = "go_live_approved",
            nullable = false)
    private boolean goLiveApproved;

    @Column(
            name = "internal_notes",
            columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "launched_at")
    private OffsetDateTime launchedAt;
}