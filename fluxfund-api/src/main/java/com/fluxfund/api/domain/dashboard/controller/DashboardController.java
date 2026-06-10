package com.fluxfund.api.domain.dashboard.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.dashboard.dto.DashboardActionItemsResponse;
import com.fluxfund.api.domain.dashboard.dto.DashboardAlertsResponse;
import com.fluxfund.api.domain.dashboard.dto.DashboardSummaryResponse;
import com.fluxfund.api.domain.dashboard.dto.ExpenseByCategoryResponse;
import com.fluxfund.api.domain.dashboard.dto.FundOverviewResponse;
import com.fluxfund.api.domain.dashboard.dto.MonthlyCashFlowResponse;
import com.fluxfund.api.domain.dashboard.service.DashboardService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

        private final DashboardService service;

        @GetMapping("/summary")
        public ResponseEntity<DashboardSummaryResponse> getSummary(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                return ResponseEntity.ok(
                                service.getSummary(organizationId, startDate, endDate));
        }

        @GetMapping("/monthly-cash-flow")
        public ResponseEntity<List<MonthlyCashFlowResponse>> getMonthlyCashFlow(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                return ResponseEntity.ok(
                                service.getMonthlyCashFlow(organizationId, startDate, endDate));
        }

        @GetMapping("/expenses-by-category")
        public ResponseEntity<List<ExpenseByCategoryResponse>> getExpensesByCategory(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @RequestParam(required = false) Integer limit) {

                return ResponseEntity.ok(
                                service.getExpensesByCategory(
                                                organizationId,
                                                startDate,
                                                endDate,
                                                limit));
        }

        @GetMapping("/funds-overview")
        public ResponseEntity<List<FundOverviewResponse>> getFundsOverview(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @RequestParam(required = false) Integer limit) {

                return ResponseEntity.ok(
                                service.getFundsOverview(
                                                organizationId,
                                                startDate,
                                                endDate,
                                                limit));
        }

        @GetMapping("/alerts")
        public ResponseEntity<DashboardAlertsResponse> getAlerts(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

                return ResponseEntity.ok(
                                service.getAlerts(organizationId, startDate, endDate));
        }

        @GetMapping("/action-items")
        public ResponseEntity<DashboardActionItemsResponse> getActionItems(
                        @RequestHeader(ORGANIZATION_ID) UUID organizationId,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
                        @RequestParam(required = false) Integer limit) {

                return ResponseEntity.ok(
                                service.getActionItems(
                                                organizationId,
                                                startDate,
                                                endDate,
                                                limit));
        }
}