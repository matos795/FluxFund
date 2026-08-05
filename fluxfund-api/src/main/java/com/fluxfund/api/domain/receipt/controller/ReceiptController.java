package com.fluxfund.api.domain.receipt.controller;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.receipt.ReceiptStatus;
import com.fluxfund.api.domain.receipt.ReceiptType;
import com.fluxfund.api.domain.receipt.dto.CancelReceiptRequest;
import com.fluxfund.api.domain.receipt.dto.CreateReceiptDraftRequest;
import com.fluxfund.api.domain.receipt.dto.ReceiptFile;
import com.fluxfund.api.domain.receipt.dto.ReceiptResponse;
import com.fluxfund.api.domain.receipt.service.ReceiptIssuanceService;
import com.fluxfund.api.domain.receipt.service.ReceiptService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/receipts")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService service;
    private final ReceiptIssuanceService issuanceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReceiptResponse createDraft(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @Valid @RequestBody CreateReceiptDraftRequest request) {

        return service.createDraft(

                organizationId,

                request);
    }

    @PutMapping("/{receiptId}")
    public ReceiptResponse updateDraft(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId,

            @Valid @RequestBody CreateReceiptDraftRequest request) {

        return service.updateDraft(

                organizationId,

                receiptId,

                request);
    }

    @GetMapping("/{receiptId}")
    public ReceiptResponse findById(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId) {

        return service.findById(

                organizationId,

                receiptId);
    }

    @GetMapping
    public Page<ReceiptResponse> findAll(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @RequestParam(required = false) ReceiptStatus status,

            @RequestParam(required = false) ReceiptType receiptType,

            Pageable pageable) {

        return service.findAll(

                organizationId,

                status,

                receiptType,

                pageable);
    }

    @DeleteMapping("/{receiptId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDraft(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId) {

        service.deleteDraft(

                organizationId,

                receiptId);
    }

    @GetMapping(value = "/{receiptId}/preview.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> previewPdf(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId) {

        ReceiptFile file = issuanceService.preview(

                organizationId,

                receiptId);

        return pdfResponse(
                file,
                true);
    }

    @PostMapping("/{receiptId}/issue")
    public ReceiptResponse issue(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId) {

        return issuanceService.issue(

                organizationId,

                receiptId);
    }

    @GetMapping(value = "/{receiptId}/file", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId) {

        ReceiptFile file = issuanceService.download(

                organizationId,

                receiptId);

        return pdfResponse(
                file,
                false);
    }

    @PatchMapping("/{receiptId}/cancel")
    public ReceiptResponse cancel(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId,

            @Valid @RequestBody CancelReceiptRequest request) {

        return issuanceService.cancel(

                organizationId,

                receiptId,

                request.reason());
    }

    @PostMapping("/{receiptId}/reissue")
    @ResponseStatus(HttpStatus.CREATED)
    public ReceiptResponse reissue(

            @RequestHeader(ORGANIZATION_ID) UUID organizationId,

            @PathVariable UUID receiptId) {

        return issuanceService.reissue(

                organizationId,

                receiptId);
    }

    private ResponseEntity<byte[]> pdfResponse(

            ReceiptFile file,

            boolean inline) {

        ContentDisposition disposition = inline

                ? ContentDisposition
                        .inline()
                        .filename(

                                file.filename(),

                                StandardCharsets.UTF_8)
                        .build()

                : ContentDisposition
                        .attachment()
                        .filename(

                                file.filename(),

                                StandardCharsets.UTF_8)
                        .build();

        return ResponseEntity.ok()

                .contentType(
                        MediaType.APPLICATION_PDF)

                .header(
                        HttpHeaders.CONTENT_DISPOSITION,

                        disposition.toString())

                .header(
                        HttpHeaders.CACHE_CONTROL,

                        "no-store")

                .header(
                        "X-Content-Type-Options",

                        "nosniff")

                .body(
                        file.content());
    }
}