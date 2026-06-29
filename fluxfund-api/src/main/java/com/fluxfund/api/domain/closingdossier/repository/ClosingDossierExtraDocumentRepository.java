package com.fluxfund.api.domain.closingdossier.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fluxfund.api.domain.closingdossier.ClosingDossierExtraDocument;

public interface ClosingDossierExtraDocumentRepository
        extends JpaRepository<ClosingDossierExtraDocument, UUID> {

    Optional<ClosingDossierExtraDocument> findByIdAndOrganizationId(
            UUID id,
            UUID organizationId);

    List<ClosingDossierExtraDocument>
            findAllByOrganizationIdAndPeriodStartDateAndPeriodEndDateOrderBySortOrderAscUploadedAtAsc(
                    UUID organizationId,
                    LocalDate periodStartDate,
                    LocalDate periodEndDate);
}