package com.fluxfund.api.domain.legal.dto;

import jakarta.validation.constraints.AssertTrue;

public record AcceptLegalDocumentsRequest(

        @AssertTrue(message = "Você precisa aceitar os Termos de Uso")
        boolean termsAccepted,

        @AssertTrue(message = "Você precisa confirmar a ciência do Aviso de Privacidade")
        boolean privacyNoticeAcknowledged) {
}