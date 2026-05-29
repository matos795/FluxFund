package com.fluxfund.api.domain.organizationsettings.dto;

import java.util.UUID;

public record UpdateOrganizationSettingsRequest(
        UUID defaultFundId
) {
}
