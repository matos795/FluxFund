package com.fluxfund.api.domain.organization.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateOrganizationRequest(
    
    @NotBlank(message = "Organization name is required")
    String name
) {}
