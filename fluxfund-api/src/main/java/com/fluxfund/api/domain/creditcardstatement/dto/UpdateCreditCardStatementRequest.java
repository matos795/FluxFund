package com.fluxfund.api.domain.creditcardstatement.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;

public record UpdateCreditCardStatementRequest(
        @Size(max = 255)
        String name,

        LocalDate closingDate,

        LocalDate dueDate
) {
}