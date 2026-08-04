package com.fluxfund.api.domain.receipt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelReceiptRequest(

        @NotBlank
        @Size(max = 500)
        String reason
) {
}