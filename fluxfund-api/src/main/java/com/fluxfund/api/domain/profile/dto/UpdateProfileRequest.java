package com.fluxfund.api.domain.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank
        @Size(max = 255)
        String name
) {
}