package com.fluxfund.api.shared.storage;

import java.time.Instant;

public record StorageFileEntry(
        String name,
        String storageKey,
        long sizeBytes,
        Instant lastModifiedAt
) {
}
