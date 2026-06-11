package com.fluxfund.api.domain.creditcardstatement.dto;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCreditCardStatementRequest(
        @NotNull
        UUID creditCardAccountId,

        @NotBlank
        @Size(max = 255)
        String name,

        LocalDate closingDate,

        @NotNull
        LocalDate dueDate
) {
}