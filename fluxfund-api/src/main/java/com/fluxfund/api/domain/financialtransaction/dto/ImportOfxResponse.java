package com.fluxfund.api.domain.financialtransaction.dto;

import java.util.List;

public record ImportOfxResponse(
        int imported,
        int ignoredDuplicates,
        int failed,
        List<String> errors
) {
}