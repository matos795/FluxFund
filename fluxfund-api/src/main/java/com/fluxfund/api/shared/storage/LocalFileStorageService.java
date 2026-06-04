package com.fluxfund.api.shared.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fluxfund.api.shared.exception.BusinessException;

@Service
public class LocalFileStorageService {

    private final Path rootPath;

    public LocalFileStorageService (
        @Value("${app.storage.local-root}") String localRoot
    ) {
        this.rootPath = Path.of(localRoot).toAbsolutePath().normalize();
    }

    public void save(String storageKey, InputStream inputStream) {
        try {
            Path targetPath = resolve(storageKey);
            Files.createDirectories(targetPath.getParent());
            Files.copy(inputStream, targetPath);
        } catch (IOException exception) {
            throw new BusinessException("Could not save file");
        }
    }

    public byte[] read(String storageKey) {
        try {
            Path path = resolve(storageKey);

            if (!Files.exists(path)) {
                throw new BusinessException("File not found in storage");
            }

            return Files.readAllBytes(path);
        } catch (IOException exception) {
            throw new BusinessException("Could not read file");
        }
    }

    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException exception) {
            throw new BusinessException("Could not delete file");
        }
    }

    public List<StorageFileEntry> listAllFiles() {
        try {
            if (!Files.exists(rootPath)) {
                return List.of();
            }

            try (Stream<Path> walk = Files.walk(rootPath)) {
                return walk
                        .filter(Files::isRegularFile)
                        .map(this::toEntry)
                        .toList();
            }
        } catch (IOException exception) {
            throw new BusinessException("Could not list storage files");
        }
    }

    public String probeContentType(String storageKey) {
        try {
            Path path = resolve(storageKey);
            String detected = Files.probeContentType(path);
            return detected != null ? detected : "application/octet-stream";
        } catch (IOException exception) {
            return "application/octet-stream";
        }
    }

    private StorageFileEntry toEntry(Path path) {
        try {
            String storageKey = rootPath.relativize(path).toString().replace("\\", "/");
            long sizeBytes = Files.size(path);
            Instant createdAt = Files.getLastModifiedTime(path).toInstant();
            return new StorageFileEntry(path.getFileName().toString(), storageKey, sizeBytes, createdAt);
        } catch (IOException exception) {
            throw new BusinessException("Could not read file metadata");
        }
    }

    private Path resolve(String storageKey) {
        Path resolvedPath = rootPath.resolve(storageKey).normalize();

        if (!resolvedPath.startsWith(rootPath)) {
            throw new BusinessException("Invalid file path");
        }

        return resolvedPath;
    }
}
