package com.fluxfund.api.domain.fund.mapper;

import java.math.BigDecimal;

import com.fluxfund.api.domain.fund.Fund;
import com.fluxfund.api.domain.fund.dto.CreateFundRequest;
import com.fluxfund.api.domain.fund.dto.FundResponse;
import com.fluxfund.api.domain.fund.dto.FundSummaryResponse;
import com.fluxfund.api.domain.fund.dto.UpdateFundRequest;
import com.fluxfund.api.domain.organization.Organization;
import com.fluxfund.api.shared.util.StringNormalizer;

public class FundMapper {

    public static Fund createEntity(CreateFundRequest request, Organization organization) {
        return new Fund(
            organization,
            StringNormalizer.normalize(request.name()),
            StringNormalizer.normalize(request.description()),
            request.initialBalance() != null ? request.initialBalance() : BigDecimal.ZERO,
            request.initialBalanceDate(),
            true
        );
    }

    public static FundResponse toResponse(Fund fund, BigDecimal sum) {
        return new FundResponse(
            fund.getId(),
            fund.getName(),
            fund.getDescription(),
            fund.getInitialBalance(),
            fund.getInitialBalanceDate(),
            fund.getInitialBalance().add(sum),
            fund.isActive(),
            fund.getCreatedAt(),
            fund.getUpdatedAt()
        );
    }

    public static FundSummaryResponse toSummaryResponse(Fund fund) {
        return new FundSummaryResponse(
            fund.getId(),
            fund.getName()
        );
    }

    public static void updateEntity(Fund fund, UpdateFundRequest request) {
        if (request.name() != null) {
            fund.setName(StringNormalizer.normalize(request.name()));
        }
        if (request.description() != null) {
            fund.setDescription(StringNormalizer.normalize(request.description()));
        }
        if (request.initialBalance() != null) {
            fund.setInitialBalance(request.initialBalance());
        }
        if (request.initialBalanceDate() != null) {
            fund.setInitialBalanceDate(request.initialBalanceDate());
        }
    }
}
