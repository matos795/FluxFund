package com.fluxfund.api.domain.fundtransfer.mapper;

import com.fluxfund.api.domain.fund.mapper.FundMapper;
import com.fluxfund.api.domain.fundtransfer.FundTransfer;
import com.fluxfund.api.domain.fundtransfer.dto.FundTransferResponse;

public class FundTransferMapper {

    public static FundTransferResponse toResponse(FundTransfer transfer) {
        return new FundTransferResponse(
                transfer.getId(),
                FundMapper.toSummaryResponse(transfer.getSourceFund()),
                FundMapper.toSummaryResponse(transfer.getDestinationFund()),
                transfer.getAmount(),
                transfer.getTransferDate(),
                transfer.getDescription(),
                transfer.getStatus(),
                transfer.getCreatedAt(),
                transfer.getUpdatedAt());
    }
}