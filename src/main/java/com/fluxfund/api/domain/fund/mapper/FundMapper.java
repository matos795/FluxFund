package com.fluxfund.api.domain.fund.mapper;

import java.math.BigDecimal;

import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.dto.CreateFundRequest;
import com.fluxfund.api.domain.fund.dto.FundResponse;
import com.fluxfund.api.domain.fund.dto.UpdateFundRequest;
import com.fluxfund.api.domain.organization.Organization;

public class FundMapper {

    public static Fund createEntity(CreateFundRequest request, Organization organization) {
        return new Fund(
            organization,
            request.name().trim(),
            request.description() != null ? request.description().trim() : null,
            request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO,
            request.initialBalanceDate(),
            true
        );
    }

    public static FundResponse toResponse(Fund fund) {
        return new FundResponse(
            fund.getId(),
            fund.getOrganization().getId(),
            fund.getName(),
            fund.getDescription(),
            fund.getInitialBalance(),
            fund.getInitialBalanceDate(),
            fund.getInitialBalance(),
            fund.isActive(),
            fund.getCreatedAt(),
            fund.getUpdatedAt()
        );
    }

    public static void updateEntity(Fund fund, UpdateFundRequest request) {
        if (request.name() != null) {
            fund.setName(request.name().trim());
        }
        if (request.description() != null) {
            fund.setDescription(request.description().trim());
        }
        if (request.initialBalance() != null) {
            fund.setInitialBalance(request.initialBalance());
        }
        if (request.initialBalanceDate() != null) {
            fund.setInitialBalanceDate(request.initialBalanceDate());
        }
        if (request.active() != null) {
            fund.setActive(request.active());
        }
    }
}
