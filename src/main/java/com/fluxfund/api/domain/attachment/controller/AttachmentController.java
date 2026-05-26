package com.fluxfund.api.domain.attachment.controller;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fluxfund.api.domain.attachment.AttachmentType;
import com.fluxfund.api.domain.attachment.dto.AttachmentFile;
import com.fluxfund.api.domain.attachment.dto.AttachmentResponse;
import com.fluxfund.api.domain.attachment.service.AttachmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/financial-transactions/{transactionId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse upload(
            @RequestParam UUID organizationId,
            @PathVariable UUID transactionId,
            @RequestParam AttachmentType type,
            @RequestParam MultipartFile file) {
        return service.upload(organizationId, transactionId, type, file);
    }

    @GetMapping
    public List<AttachmentResponse> findAllByTransaction(
            @RequestParam UUID organizationId,
            @PathVariable UUID transactionId) {
        return service.findAllByTransaction(organizationId, transactionId);
    }

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<byte[]> download(
            @RequestParam UUID organizationId,
            @PathVariable UUID attachmentId) {
        AttachmentFile file = service.download(organizationId, attachmentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        file.contentType() != null ? file.contentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.filename()).build().toString())
                .body(file.content());
    }

    @DeleteMapping("/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestParam UUID organizationId,
            @PathVariable UUID attachmentId) {
        service.delete(organizationId, attachmentId);
    }
}
