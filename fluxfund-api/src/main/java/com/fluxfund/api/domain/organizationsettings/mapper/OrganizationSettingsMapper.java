package com.fluxfund.api.domain.organizationsettings.mapper;

import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.organizationsettings.OrganizationSettings;
import com.fluxfund.api.domain.organizationsettings.dto.OrganizationSettingsResponse;

public class OrganizationSettingsMapper {

    private OrganizationSettingsMapper() {
    }

    public static OrganizationSettingsResponse toResponse(OrganizationSettings settings) {
        return new OrganizationSettingsResponse(
                settings.getId(),
                settings.getOrganization().getId(),
                settings.getDefaultFund() != null
                        ? FundMapper.toSummaryResponse(settings.getDefaultFund())
                        : null,
                settings.getCreatedAt(),
                settings.getUpdatedAt(),
                settings.isAllowNegativeFunds(),
                settings.isSuggestDefaultFundReallocation(),
                settings.isRequireFiscalDocumentForExpenses(),
                settings.isRequireProofForIncomes(),
                settings.isAutoFillClassificationSuggestions());
    }
}