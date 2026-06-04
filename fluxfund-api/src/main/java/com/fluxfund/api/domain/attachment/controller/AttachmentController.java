package com.fluxfund.api.domain.attachment.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.attachment.dto.AttachmentFile;
import com.fluxfund.api.domain.attachment.dto.AttachmentResponse;
import com.fluxfund.api.domain.attachment.service.AttachmentService;

import lombok.RequiredArgsConstructor;

import static com.fluxfund.api.security.TenantHeaders.ORGANIZATION_ID;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService service;

    @PostMapping(value = "/api/v1/financial-transactions/{transactionId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse upload(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID transactionId,
            @RequestParam AttachmentType type,
            @RequestParam MultipartFile file) {
        return service.upload(organizationId, transactionId, type, file);
    }

    @GetMapping("/api/v1/financial-transactions/{transactionId}/attachments")
    public List<AttachmentResponse> findAllByTransaction(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID transactionId) {
        return service.findAllByTransaction(organizationId, transactionId);
    }

    @GetMapping("/api/v1/attachments/{attachmentId}/download")
    public ResponseEntity<byte[]> download(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID attachmentId) {
        AttachmentFile file = service.download(organizationId, attachmentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        file.contentType() != null
                                ? file.contentType()
                                : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(file.filename(), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .header("X-Content-Type-Options", "nosniff")
                .body(file.content());
    }

    @DeleteMapping("/api/v1/attachments/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(ORGANIZATION_ID) UUID organizationId,
            @PathVariable UUID attachmentId) {
        service.delete(organizationId, attachmentId);
    }
}
