package com.fluxfund.api.domain.attachment.mapper;

import com.fluxfund.api.domain.attachment.Attachment;
import com.fluxfund.api.domain.attachment.dto.AttachmentResponse;

public class AttachmentMapper {

    private AttachmentMapper() {
    }

    public static AttachmentResponse toResponse(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getType(),
                attachment.getOriginalFilename(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getUploadedAt(),
                attachment.getCreatedAt(),
                attachment.getUpdatedAt()
        );
    }
}