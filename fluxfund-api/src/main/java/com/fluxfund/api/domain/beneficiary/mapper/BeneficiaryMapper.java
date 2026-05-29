package com.fluxfund.api.domain.beneficiary.mapper;

import com.fluxfund.api.domain.beneficiary.Beneficiary;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.BeneficiarySummaryResponse;
import com.fluxfund.api.domain.beneficiary.dto.CreateBeneficiaryRequest;
import com.fluxfund.api.domain.beneficiary.dto.UpdateBeneficiaryRequest;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.util.DocumentNormalizer;
import com.fluxfund.api.shared.util.EmailNormalizer;
import com.fluxfund.api.shared.util.PhoneNormalizer;
import com.fluxfund.api.shared.util.StringNormalizer;

public class BeneficiaryMapper {

    public static Beneficiary createEntity(CreateBeneficiaryRequest request, Organization organization) {
        return new Beneficiary(
            organization,
            StringNormalizer.normalize(request.name()),
            request.type(),
            DocumentNormalizer.normalize(request.document()),
            EmailNormalizer.normalize(request.email()),
            PhoneNormalizer.normalize(request.phone()),
            true
        );
    }

    public static BeneficiaryResponse toResponse(Beneficiary beneficiary) {
        return new BeneficiaryResponse(
            beneficiary.getId(),
            beneficiary.getName(),
            beneficiary.getType(),
            beneficiary.getDocument(),
            beneficiary.getEmail(),
            beneficiary.getPhone(),
            beneficiary.isActive(),
            beneficiary.getCreatedAt(),
            beneficiary.getUpdatedAt()
        );
    }

    public static BeneficiarySummaryResponse toSummaryResponse(Beneficiary beneficiary) {
        return new BeneficiarySummaryResponse(
            beneficiary.getId(),
            beneficiary.getName(),
            beneficiary.getType()
        );
    }

    public static void updateEntity(Beneficiary beneficiary, UpdateBeneficiaryRequest request) {
        if (request.name() != null) {
            beneficiary.setName(StringNormalizer.normalize(request.name()));
        }
        if (request.document() != null) {
            beneficiary.setDocument(DocumentNormalizer.normalize(request.document()));
        }
        if (request.email() != null) {
            beneficiary.setEmail(EmailNormalizer.normalize(request.email()));
        }
        if (request.phone() != null) {
            beneficiary.setPhone(PhoneNormalizer.normalize(request.phone()));
        }
        if (request.type() != null) {
            beneficiary.setType(request.type());
        }
    }
}
