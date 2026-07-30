package com.fluxfund.api.domain.beneficiary.mapper;

import java.util.HashSet;
import java.util.Set;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.FinancialPartyRole;
import com.fluxfund.api.domain.beneficiary.FinancialPartyType;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiarySummaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.CreateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.dto.UpdateBeneficiaryRequest;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.util.DocumentNormalizer;
import com.fluxfund.api.shared.util.EmailNormalizer;
import com.fluxfund.api.shared.util.PhoneNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

public final class BeneficiaryMapper {

    private BeneficiaryMapper() {
    }

    public static Beneficiary createEntity(CreateBeneficiaryRequest request, Organization organization) {

        String normalizedDocument = DocumentNormalizer.normalize(request.document());

        Beneficiary beneficiary = new Beneficiary();

        beneficiary.setOrganization(organization);

        beneficiary.setName(StringNormalizer.normalize(request.name()));

        beneficiary.setType(request.type());

        beneficiary.setDocument(normalizedDocument);

        beneficiary.setPartyType(resolvePartyType(request.partyType(), normalizedDocument));

        beneficiary.setRoles(resolveCreateRoles(request.roles()));

        beneficiary.setEmail(EmailNormalizer.normalize(request.email()));

        beneficiary.setPhone(PhoneNormalizer.normalize(request.phone()));

        beneficiary.setLegalName(StringNormalizer.normalize(request.legalName()));

        beneficiary.setContactPerson(StringNormalizer.normalize(request.contactPerson()));

        beneficiary.setAddressLine(StringNormalizer.normalize(request.addressLine()));

        beneficiary.setAddressNumber(StringNormalizer.normalize(request.addressNumber()));

        beneficiary.setAddressComplement(StringNormalizer.normalize(request.addressComplement()));

        beneficiary.setNeighborhood(StringNormalizer.normalize(request.neighborhood()));

        beneficiary.setCity(StringNormalizer.normalize(request.city()));

        beneficiary.setState(normalizeState(request.state()));

        beneficiary.setZipCode(normalizeZipCode(request.zipCode()));

        beneficiary.setNotes(StringNormalizer.normalize(request.notes()));

        beneficiary.setActive(true);

        return beneficiary;
    }

    public static BeneficiaryResponse toResponse(Beneficiary beneficiary) {

        return new BeneficiaryResponse(
                beneficiary.getId(),
                beneficiary.getName(),
                beneficiary.getType(),
                beneficiary.getPartyType(),
                Set.copyOf(beneficiary.getRoles()),
                beneficiary.getDocument(),
                beneficiary.getEmail(),
                beneficiary.getPhone(),
                beneficiary.getLegalName(),
                beneficiary.getContactPerson(),
                beneficiary.getAddressLine(),
                beneficiary.getAddressNumber(),
                beneficiary.getAddressComplement(),
                beneficiary.getNeighborhood(),
                beneficiary.getCity(),
                beneficiary.getState(),
                beneficiary.getZipCode(),
                beneficiary.getNotes(),
                beneficiary.isActive(),
                beneficiary.getCreatedAt(),
                beneficiary.getUpdatedAt());
    }

    public static BeneficiarySummaryResponse toSummaryResponse(Beneficiary beneficiary) {

        return new BeneficiarySummaryResponse(
                beneficiary.getId(),
                beneficiary.getName(),
                beneficiary.getType());
    }

    public static void updateEntity(Beneficiary beneficiary, UpdateBeneficiaryRequest request) {

        if (request.name() != null) {
            beneficiary.setName(StringNormalizer.normalize(request.name()));
        }

        if (request.type() != null) {
            beneficiary.setType(request.type());
        }

        if (request.document() != null) {
            String normalizedDocument = DocumentNormalizer.normalize(request.document());

            beneficiary.setDocument(normalizedDocument);

            if (request.partyType() == null && normalizedDocument != null) {
                beneficiary.setPartyType(inferPartyType(normalizedDocument));
            }
        }

        if (request.partyType() != null) {
            beneficiary.setPartyType(request.partyType());
        }

        if (request.roles() != null) {
            beneficiary.setRoles(new HashSet<>(request.roles()));
        }

        if (request.email() != null) {
            beneficiary.setEmail(EmailNormalizer.normalize(request.email()));
        }

        if (request.phone() != null) {
            beneficiary.setPhone(PhoneNormalizer.normalize(request.phone()));
        }

        if (request.legalName() != null) {
            beneficiary.setLegalName(StringNormalizer.normalize(request.legalName()));
        }

        if (request.contactPerson() != null) {
            beneficiary.setContactPerson(StringNormalizer.normalize(request.contactPerson()));
        }

        if (request.addressLine() != null) {
            beneficiary.setAddressLine(StringNormalizer.normalize(request.addressLine()));
        }

        if (request.addressNumber() != null) {
            beneficiary.setAddressNumber(StringNormalizer.normalize(request.addressNumber()));
        }

        if (request.addressComplement() != null) {
            beneficiary.setAddressComplement(StringNormalizer.normalize(request.addressComplement()));
        }

        if (request.neighborhood() != null) {
            beneficiary.setNeighborhood(StringNormalizer.normalize(request.neighborhood()));
        }

        if (request.city() != null) {
            beneficiary.setCity(StringNormalizer.normalize(request.city()));
        }

        if (request.state() != null) {
            beneficiary.setState(normalizeState(request.state()));
        }

        if (request.zipCode() != null) {
            beneficiary.setZipCode(normalizeZipCode(request.zipCode()));
        }

        if (request.notes() != null) {
            beneficiary.setNotes(StringNormalizer.normalize(request.notes()));
        }
    }

    private static Set<FinancialPartyRole> resolveCreateRoles(Set<FinancialPartyRole> roles) {

        if (roles == null || roles.isEmpty()) {
            return new HashSet<>(Set.of(FinancialPartyRole.PAYMENT_RECIPIENT));
        }

        return new HashSet<>(roles);
    }

    private static FinancialPartyType resolvePartyType(FinancialPartyType requestedType, String normalizedDocument) {

        if (requestedType != null) {
            return requestedType;
        }

        return inferPartyType(normalizedDocument);
    }

    private static FinancialPartyType inferPartyType(String normalizedDocument) {

        if (normalizedDocument != null && normalizedDocument.length() == 14) {
            return FinancialPartyType.LEGAL_ENTITY;
        }

        return FinancialPartyType.INDIVIDUAL;
    }

    private static String normalizeState(String state) {

        String normalized = StringNormalizer.normalize(state);

        return normalized != null ? normalized.toUpperCase() : null;
    }

    private static String normalizeZipCode(String zipCode) {

        return DocumentNormalizer.normalize(zipCode);
    }
}