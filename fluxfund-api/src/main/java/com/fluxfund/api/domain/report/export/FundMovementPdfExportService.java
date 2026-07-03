package com.fluxfund.api.domain.report.export;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fluxfund.api.domain.closingdossier.export.ClosingDossierPdfGenerator;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.repository.OrganizationRepository;
import com.fluxfund.api.domain.report.dto.fund.FundMovementReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;
import com.fluxfund.api.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FundMovementPdfExportService {

    private final ReportService reportService;
    private final OrganizationRepository organizationRepository;
    private final ClosingDossierPdfGenerator pdfGenerator;

    public byte[] exportFundMovementReport(
            UUID organizationId,
            LocalDate startDate,
            LocalDate endDate) {

        Organization organization = organizationRepository
                .findByIdAndActiveTrue(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization not found"));

        FundMovementReportResponse report =
                reportService.getFundMovementReport(
                        organizationId,
                        startDate,
                        endDate);

        return pdfGenerator.generateFundMovementReport(
                organization,
                report);
    }
}