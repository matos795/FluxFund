package com.fluxfund.api.domain.importbatch;

import java.time.LocalDateTime;

import com.fluxfund.api.domain.account.Account;
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
@Table(name = "import_batch")
@Getter
@Setter
@NoArgsConstructor
public class ImportBatch extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private ImportBatchSourceType sourceType;

    @Column(name = "import_profile", length = 60)
    private String importProfile;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImportBatchStatus status;

    @Column(name = "imported_count", nullable = false)
    private int importedCount;

    @Column(name = "ignored_duplicates_count", nullable = false)
    private int ignoredDuplicatesCount;

    @Column(name = "failed_count", nullable = false)
    private int failedCount;

    @Column(name = "imported_at", nullable = false)
    private LocalDateTime importedAt;

    @Column(name = "undone_at")
    private LocalDateTime undoneAt;
}