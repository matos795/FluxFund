package com.fluxfund.api.domain.organization.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOrganizationProfileRequest(
        @NotBlank
        @Size(max = 255)
        String name,

        @Size(max = 255)
        String legalName,

        @Size(max = 18)
        String cnpj,

        @Email
        @Size(max = 255)
        String contactEmail,

        @Size(max = 30)
        String contactPhone,

        @Size(max = 255)
        String addressLine,

        @Size(max = 30)
        String addressNumber,

        @Size(max = 120)
        String addressComplement,

        @Size(max = 120)
        String neighborhood,

        @Size(max = 120)
        String city,

        @Size(max = 2)
        String state,

        @Size(max = 10)
        String zipCode,

        @Size(max = 120)
        String reviewerName,

        @Size(max = 120)
        String reviewerTitle,

        @Size(max = 120)
        String approverName,

        @Size(max = 120)
        String approverTitle
) {
}