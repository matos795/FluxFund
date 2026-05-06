package com.fluxfund.api.domain.attachment;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

}
