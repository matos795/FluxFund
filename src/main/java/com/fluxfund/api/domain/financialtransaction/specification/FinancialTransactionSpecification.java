package com.fluxfund.api.domain.financialtransaction.specification;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;

public class FinancialTransactionSpecification {

    public static Specification<FinancialTransaction> withFilters(
            UUID organizationId,
            FinancialTransactionType type,
            FinancialTransactionStatus status,
            FinancialTransactionSource source,
            UUID accountId,
            UUID categoryId,
            String description,
            LocalDate settlementDateFrom,
            LocalDate settlementDateTo,
            Boolean onlyUnclassified,
            Boolean onlyUnallocated) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            predicates = cb.and(
                    predicates,
                    cb.equal(root.get("organization").get("id"), organizationId));

            if (type != null) {
                predicates = cb.and(predicates, cb.equal(root.get("type"), type));
            }

            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }

            if (accountId != null) {
                predicates = cb.and(
                        predicates,
                        cb.equal(root.get("account").get("id"), accountId));
            }

            if (categoryId != null) {
                predicates = cb.and(
                        predicates,
                        cb.equal(root.get("category").get("id"), categoryId));
            }

            if (description != null && !description.isBlank()) {
                predicates = cb.and(
                        predicates,
                        cb.like(
                                cb.lower(root.get("description")),
                                "%" + description.toLowerCase().trim() + "%"));
            }

            if (settlementDateFrom != null) {
                predicates = cb.and(
                        predicates,
                        cb.greaterThanOrEqualTo(root.get("settlementDate"), settlementDateFrom));
            }

            if (settlementDateTo != null) {
                predicates = cb.and(
                        predicates,
                        cb.lessThanOrEqualTo(root.get("settlementDate"), settlementDateTo));
            }

            if (source != null) {
                predicates = cb.and(
                        predicates,
                        cb.equal(root.get("source"), source));
            }

            if (Boolean.TRUE.equals(onlyUnclassified)) {
                predicates = cb.and(
                        predicates,
                        cb.isNull(root.get("category")));
            }

            if (Boolean.TRUE.equals(onlyUnallocated)) {
                predicates = cb.and(
                        predicates,
                        cb.isEmpty(root.get("allocations")));
            }

            return predicates;
        };
    }
}