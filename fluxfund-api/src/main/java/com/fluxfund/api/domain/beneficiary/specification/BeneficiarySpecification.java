package com.fluxfund.api.domain.beneficiary.specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.BeneficiaryType;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;
import com.fluxfund.api.shared.util.DocumentNormalizer;

import jakarta.persistence.criteria.Predicate;

public final class BeneficiarySpecification {

    private BeneficiarySpecification() {
    }

    public static Specification<Beneficiary> withFilters(
            UUID organizationId,
            String search,
            FinancialPartyType partyType,
            BeneficiaryType classification,
            FinancialPartyRole role,
            Boolean active) {

        return (
                root,
                criteriaQuery,
                criteriaBuilder) -> {

            List<Predicate> predicates = new ArrayList<>();

            /*
             * Regra multi-tenant obrigatória.
             *
             * Nenhuma consulta pode retornar contatos
             * pertencentes a outra organização.
             */
            predicates.add(
                    criteriaBuilder.equal(
                            root
                                    .get("organization")
                                    .get("id"),
                            organizationId));

            if (active != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("active"),
                                active));
            }

            if (partyType != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("partyType"),
                                partyType));
            }

            if (classification != null) {

                predicates.add(
                        criteriaBuilder.equal(
                                root.get("type"),
                                classification));
            }

            /*
             * Como roles é uma ElementCollection,
             * precisamos fazer join com beneficiary_role.
             *
             * distinct evita repetir um contato que possua
             * mais de um papel.
             */
            if (role != null) {

                var rolesJoin = root.joinSet("roles");

                predicates.add(
                        criteriaBuilder.equal(
                                rolesJoin,
                                role));

                criteriaQuery.distinct(true);
            }

            if (search != null
                    && !search.isBlank()) {

                String normalizedSearch = search
                        .trim()
                        .toLowerCase(
                                Locale.ROOT);

                String textPattern = "%"
                        + normalizedSearch
                        + "%";

                List<Predicate> searchPredicates = new ArrayList<>();

                searchPredicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("name")),
                                textPattern));

                searchPredicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("legalName")),
                                textPattern));

                searchPredicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("contactPerson")),
                                textPattern));

                searchPredicates.add(
                        criteriaBuilder.like(
                                criteriaBuilder.lower(
                                        root.get("email")),
                                textPattern));

                /*
                 * Além do texto, tentamos interpretar
                 * a pesquisa como CPF/CNPJ.
                 *
                 * "123.456" vira "123456".
                 */
                String normalizedDocument = DocumentNormalizer.normalize(
                        search);

                if (normalizedDocument != null
                        && !normalizedDocument.isBlank()) {

                    searchPredicates.add(
                            criteriaBuilder.like(
                                    root.get("document"),
                                    "%"
                                            + normalizedDocument
                                            + "%"));
                }

                predicates.add(
                        criteriaBuilder.or(
                                searchPredicates.toArray(
                                        new Predicate[0])));
            }

            return criteriaBuilder.and(
                    predicates.toArray(
                            new Predicate[0]));
        };
    }
}