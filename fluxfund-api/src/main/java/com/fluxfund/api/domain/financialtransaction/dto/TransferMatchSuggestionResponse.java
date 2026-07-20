package com.fluxfund.api.domain.financialtransaction.dto;

import java.util.List;

import com.fluxfund.api.domain.financialtransaction.TransferDirection;

public record TransferMatchSuggestionResponse(
        boolean available,
        TransferDirection suggestedDirection,
        List<TransferMatchCandidateResponse> candidates
) {

    public static TransferMatchSuggestionResponse unavailable() {

        return new TransferMatchSuggestionResponse(
                false,
                null,
                List.of());
    }
}