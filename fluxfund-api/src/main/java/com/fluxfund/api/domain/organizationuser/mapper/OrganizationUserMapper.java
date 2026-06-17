package com.fluxfund.api.domain.organizationuser.mapper;

import com.fluxfund.api.domain.organizationuser.OrganizationUser;
import com.fluxfund.api.domain.organizationuser.dto.OrganizationUserResponse;

public class OrganizationUserMapper {

    private OrganizationUserMapper() {
    }

    public static OrganizationUserResponse toResponse(OrganizationUser organizationUser) {
        return new OrganizationUserResponse(
                organizationUser.getUser().getId(),
                organizationUser.getUser().getName(),
                organizationUser.getUser().getEmail(),
                organizationUser.getRole(),
                organizationUser.isActive(),
                organizationUser.getCreatedAt(),
                organizationUser.getUpdatedAt()
        );
    }
}