package com.fluxfund.api.domain.receipt.dto;

public record ReceiptFile(

        String filename,

        String contentType,

        byte[] content
) {
}