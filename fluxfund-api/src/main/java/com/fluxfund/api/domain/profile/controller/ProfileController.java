package com.fluxfund.api.domain.profile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fluxfund.api.domain.profile.dto.ChangePasswordRequest;
import com.fluxfund.api.domain.profile.dto.ProfileResponse;
import com.fluxfund.api.domain.profile.dto.UpdateProfileRequest;
import com.fluxfund.api.domain.profile.service.ProfileService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService service;

    @GetMapping
    public ResponseEntity<ProfileResponse> findCurrent() {
        return ResponseEntity.ok(service.findCurrent());
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> update(
            @RequestBody @Valid UpdateProfileRequest request) {

        return ResponseEntity.ok(service.update(request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @RequestBody @Valid ChangePasswordRequest request) {

        service.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}