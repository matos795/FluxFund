package com.fluxfund.api.domain.organization.mapper;

import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.domain.organization.dto.OrganizationResponse;

public class OrganizationMapper {

    private OrganizationMapper() {
    }

    public static OrganizationResponse toResponse(Organization organization) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.isActive(),
                organization.getCreatedAt()
        );
    }
}
