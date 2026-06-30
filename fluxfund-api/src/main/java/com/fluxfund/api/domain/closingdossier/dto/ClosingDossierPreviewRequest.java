package com.fluxfund.api.domain.closingdossier.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record ClosingDossierPreviewRequest(

                @NotNull LocalDate periodStartDate,

                @NotNull LocalDate periodEndDate,

                @NotEmpty List<@NotNull UUID> accountIds,

                Boolean includeAccountsWithoutMovement,

                Boolean includeIncomes,

                Boolean includeExpenses,

                Boolean includeTransfers,

                Boolean includeSupportReport,

                Boolean includePayablesReport,
                
                Boolean includeReceivablesReport
        ) {
}