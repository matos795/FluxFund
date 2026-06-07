package com.fluxfund.api.domain.financialtransaction.specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.fluxfund.api.domain.financialtransaction.FinancialTransaction;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionSource;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionStatus;
import com.fluxfund.api.domain.financialtransaction.FinancialTransactionType;
import com.fluxfund.api.domain.transactionallocation.TransactionAllocation;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

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
                        Boolean onlyUnallocated,
                        UUID fundId) {
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
                        } else {
                                predicates = cb.and(
                                                predicates,
                                                cb.notEqual(root.get("status"), FinancialTransactionStatus.CANCELED));
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
                                String searchTerm = "%" + description.trim().toLowerCase() + "%";

                                Predicate descriptionPredicate = cb.like(
                                                cb.lower(root.get("description")),
                                                searchTerm);

                                Predicate rawDescriptionPredicate = cb.like(
                                                cb.lower(root.get("rawDescription")),
                                                searchTerm);

                                predicates = cb.and(
                                                predicates,
                                                cb.or(descriptionPredicate, rawDescriptionPredicate));
                        }

                        if (settlementDateFrom != null) {
                                predicates = cb.and(
                                                predicates,
                                                cb.greaterThanOrEqualTo(root.get("settlementDate"),
                                                                settlementDateFrom));
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

                                predicates = cb.and(
                                                predicates,
                                                cb.notEqual(root.get("status"), FinancialTransactionStatus.CANCELED));
                        }

                        if (Boolean.TRUE.equals(onlyUnallocated)) {
                                predicates = cb.and(
                                                predicates,
                                                cb.equal(root.get("status"), FinancialTransactionStatus.SETTLED));

                                predicates = cb.and(
                                                predicates,
                                                cb.notEqual(root.get("type"), FinancialTransactionType.TRANSFER));

                                predicates = cb.and(
                                                predicates,
                                                cb.isNotNull(root.get("category")));

                                Subquery<BigDecimal> allocationSum = query.subquery(BigDecimal.class);
                                Root<TransactionAllocation> allocationRoot = allocationSum
                                                .from(TransactionAllocation.class);

                                allocationSum.select(
                                                cb.coalesce(
                                                                cb.sum(
                                                                                cb.abs(allocationRoot.get("amount"))),
                                                                BigDecimal.ZERO));

                                allocationSum.where(
                                                cb.equal(
                                                                allocationRoot.get("financialTransaction"),
                                                                root));

                                predicates = cb.and(
                                                predicates,
                                                cb.greaterThan(
                                                                cb.abs(root.get("settledAmount")),
                                                                allocationSum));
                        }

                        if (fundId != null) {
                                Subquery<UUID> fundTransactionSubquery = query.subquery(UUID.class);
                                Root<TransactionAllocation> allocationRoot = fundTransactionSubquery
                                                .from(TransactionAllocation.class);

                                fundTransactionSubquery.select(
                                                allocationRoot.get("financialTransaction").get("id"));

                                fundTransactionSubquery.where(
                                                cb.and(
                                                                cb.equal(allocationRoot.get("fund").get("id"), fundId),
                                                                cb.equal(allocationRoot.get("organization").get("id"),
                                                                                organizationId)));

                                predicates = cb.and(
                                                predicates,
                                                root.get("id").in(fundTransactionSubquery));
                        }

                        return predicates;
                };
        }
}