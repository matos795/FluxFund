package com.fluxfund.api.domain.audit.repository;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.fluxfund.api.domain.audit.AuditAction;
import com.fluxfund.api.domain.audit.AuditEntityType;
import com.fluxfund.api.domain.audit.AuditLog;

import jakarta.persistence.criteria.Predicate;

public final class AuditLogSpecification {

    private AuditLogSpecification() {
    }

    public static Specification<AuditLog> withFilters(
            UUID organizationId,
            UUID actorUserId,
            AuditEntityType entityType,
            UUID entityId,
            AuditAction action,
            OffsetDateTime createdAtFrom,
            OffsetDateTime createdAtTo
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(
                    root.get("organizationId"),
                    organizationId
            ));

            if (actorUserId != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("actorUserId"),
                        actorUserId
                ));
            }

            if (entityType != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("entityType"),
                        entityType
                ));
            }

            if (entityId != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("entityId"),
                        entityId
                ));
            }

            if (action != null) {
                predicates.add(criteriaBuilder.equal(
                        root.get("action"),
                        action
                ));
            }

            if (createdAtFrom != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        createdAtFrom
                ));
            }

            if (createdAtTo != null) {
                predicates.add(criteriaBuilder.lessThan(
                        root.get("createdAt"),
                        createdAtTo
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}