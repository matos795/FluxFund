package com.fluxfund.api.domain.report.controller;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.report.dto.accountability.AccountabilityByAccountReportResponse;
import com.fluxfund.api.domain.report.dto.accountability.AccountabilityReportResponse;
import com.fluxfund.api.domain.report.dto.category.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.fund.FundReportResponse;
import com.fluxfund.api.domain.report.dto.pending.PendingItemsReportResponse;
import com.fluxfund.api.domain.report.export.AccountabilityExcelExportService;
import com.fluxfund.api.domain.report.service.ReportService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

        private final ReportService service;
        private final AccountabilityExcelExportService accountabilityExcelExportService;

        @GetMapping("/category-result")
        public ResponseEntity<CategoryResultReportResponse> getCategoryResultReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,

                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,

                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                return ResponseEntity.ok(
                                service.getCategoryResultReport(
                                                organizationId,
                                                startDate,
                                                endDate));
        }

        @GetMapping("/funds")
        public ResponseEntity<FundReportResponse> getFundReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(service.getFundReport(organizationId, startDate, endDate));
        }

        @GetMapping("/accountability")
        public ResponseEntity<AccountabilityReportResponse> getAccountabilityReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(
                                service.getAccountabilityReport(organizationId, startDate, endDate));
        }

        @GetMapping("/accountability/by-account")
        public ResponseEntity<AccountabilityByAccountReportResponse> getAccountabilityReportByAccount(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(
                                service.getAccountabilityReportByAccount(organizationId, startDate, endDate));
        }

        @GetMapping("/accountability/export.xlsx")
        public ResponseEntity<byte[]> exportAccountabilityReportExcel(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                byte[] file = accountabilityExcelExportService.exportAccountabilityReport(
                                organizationId,
                                startDate,
                                endDate);

                String filename = "prestacao-contas.xlsx";

                return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(
                                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                ContentDisposition.attachment()
                                                                .filename(filename)
                                                                .build()
                                                                .toString())
                                .body(file);
        }

        @GetMapping("/pending-items")
        public ResponseEntity<PendingItemsReportResponse> getPendingItemsReport(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false, defaultValue = "10") Integer limit) {

                return ResponseEntity.ok(
                                service.getPendingItemsReport(organizationId, limit));
        }
}