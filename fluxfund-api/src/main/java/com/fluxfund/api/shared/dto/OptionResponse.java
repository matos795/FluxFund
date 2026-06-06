package com.fluxfund.api.shared.dto;

import java.util.UUID;

public record OptionResponse(
        UUID id,
        String label
) {
}