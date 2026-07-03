package com.fluxfund.api.domain.report.export;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.accountmovement.AccountMovementReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountMovementPdfExportService {

    private final ReportService reportService;
    private final OrganizationRepository organizationRepository;
    private final ClosingDossierPdfGenerator pdfGenerator;

    public byte[] exportAccountMovementReport(
            UUID organizationId,
            UUID accountId,
            LocalDate startDate,
            LocalDate endDate) {

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization not found"));

        AccountMovementReportResponse report =
                reportService.getAccountMovementReport(
                        organizationId,
                        accountId,
                        startDate,
                        endDate);

        return pdfGenerator.generateAccountMovementReport(
                organization,
                report);
    }
}