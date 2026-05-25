package com.fluxfund.api.domain.report.controller;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.report.dto.CategoryResultReportResponse;
import com.fluxfund.api.domain.report.dto.FundReportResponse;
import com.fluxfund.api.domain.report.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

        private final ReportService service;

        @GetMapping("/category-result")
        public ResponseEntity<CategoryResultReportResponse> getCategoryResultReport(
                        @RequestParam UUID organizationId,

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
                        @RequestParam UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
                return ResponseEntity.ok(service.getFundReport(organizationId, startDate, endDate));
        }
}