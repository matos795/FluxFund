package com.fluxfund.api.domain.financialcommitment.specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitment;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentDirection;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentRecurrence;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentStatus;
import com.fluxfund.api.domain.financialcommitment.FinancialCommitmentType;
import com.fluxfund.api.domain.fund.Fund;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

public final class FinancialCommitmentSpecification {

    private FinancialCommitmentSpecification() {
    }

    public static Specification<FinancialCommitment> withFilters(

            UUID organizationId,

            String search,

            FinancialCommitmentDirection direction,

            FinancialCommitmentType commitmentType,

            FinancialCommitmentRecurrence recurrence,

            FinancialCommitmentStatus status,

            UUID partyId,

            UUID designatedRecipientId,

            UUID fundId,

            LocalDate referenceDate) {

        return (root, query, builder) -> {

            List<Predicate> predicates = new ArrayList<>();

            predicates.add(
                    builder.equal(
                            root.get("organization")
                                    .get("id"),
                            organizationId));

            if (direction != null) {
                predicates.add(
                        builder.equal(
                                root.get("direction"),
                                direction));
            }

            if (commitmentType != null) {
                predicates.add(
                        builder.equal(
                                root.get("commitmentType"),
                                commitmentType));
            }

            if (recurrence != null) {
                predicates.add(
                        builder.equal(
                                root.get("recurrence"),
                                recurrence));
            }

            if (partyId != null) {
                predicates.add(
                        builder.equal(
                                root.get("party")
                                        .get("id"),
                                partyId));
            }

            if (designatedRecipientId != null) {
                predicates.add(
                        builder.equal(
                                root.get("designatedRecipient")
                                        .get("id"),
                                designatedRecipientId));
            }

            if (fundId != null) {
                predicates.add(
                        builder.equal(
                                root.get("fund")
                                        .get("id"),
                                fundId));
            }

            if (status != null) {

                switch (status) {

                    case ACTIVE -> {
                        predicates.add(
                                builder.isTrue(
                                        root.get("active")));

                        predicates.add(
                                builder.lessThanOrEqualTo(
                                        root.get("startDate"),
                                        referenceDate));

                        predicates.add(
                                builder.or(
                                        builder.isNull(
                                                root.get("endDate")),

                                        builder.greaterThanOrEqualTo(
                                                root.get("endDate"),
                                                referenceDate)));
                    }

                    case SCHEDULED -> {
                        predicates.add(
                                builder.isTrue(
                                        root.get("active")));

                        predicates.add(
                                builder.greaterThan(
                                        root.get("startDate"),
                                        referenceDate));
                    }

                    case EXPIRED -> {
                        predicates.add(
                                builder.isTrue(
                                        root.get("active")));

                        predicates.add(
                                builder.isNotNull(
                                        root.get("endDate")));

                        predicates.add(
                                builder.lessThan(
                                        root.get("endDate"),
                                        referenceDate));
                    }

                    case INACTIVE ->
                        predicates.add(
                                builder.isFalse(
                                        root.get("active")));
                }
            }

            if (search != null
                    && !search.isBlank()) {

                String pattern = "%"
                        + search
                                .trim()
                                .toLowerCase(
                                        Locale.ROOT)
                        + "%";

                Join<FinancialCommitment, Beneficiary> party =

                        root.join(
                                "party",
                                JoinType.LEFT);

                Join<FinancialCommitment, Beneficiary> recipient =

                        root.join(
                                "designatedRecipient",
                                JoinType.LEFT);

                Join<FinancialCommitment, Fund> fund =

                        root.join(
                                "fund",
                                JoinType.LEFT);

                predicates.add(
                        builder.or(

                                builder.like(
                                        builder.lower(
                                                party.get("name")),
                                        pattern),

                                builder.like(
                                        builder.lower(
                                                recipient.get("name")),
                                        pattern),

                                builder.like(
                                        builder.lower(
                                                fund.get("name")),
                                        pattern),

                                builder.like(
                                        builder.lower(
                                                root.get("description")),
                                        pattern)));

                query.distinct(true);
            }

            return builder.and(
                    predicates.toArray(
                            Predicate[]::new));
        };
    }
}