package com.fluxfund.api.domain.report.export;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountabilityPdfExportService {

    private final ReportService reportService;
    private final OrganizationRepository organizationRepository;
    private final ClosingDossierPdfGenerator pdfGenerator;

    public byte[] exportAccountabilityReport(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {

        AccountabilityReportResponse report =
                reportService.getAccountabilityReport(
                        organizationId,
                        startDate,
                        endDate);

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization not found"));

        return pdfGenerator.generateSupportReport(
                organization,
                report);
    }
}