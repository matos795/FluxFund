package com.fluxfund.api.domain.receipt.dto;

import java.util.UUID;

public record ReceiptPartySnapshotResponse(

        UUID partyId,

        String name,

        String document,

        String address
) {
}