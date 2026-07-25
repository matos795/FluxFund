package com.fluxfund.api.domain.platform.organization;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.fluxfund.api.domain.platform.organization.dto.CreatePlatformOrganizationRequest;
import com.fluxfund.api.domain.platform.organization.dto.CreatePlatformOrganizationResponse;
import com.fluxfund.api.domain.platform.organization.dto.PlatformOrganizationResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(
        "/api/v1/platform/organizations")
@RequiredArgsConstructor
public class PlatformOrganizationController {

    private final PlatformOrganizationService
            service;

    @GetMapping
    public Page<PlatformOrganizationResponse>
            findAll(

                    @RequestParam(required = false)
                    String query,

                    @PageableDefault(
                            size = 20,
                            sort = "createdAt",
                            direction =
                                    Sort.Direction.DESC)
                    Pageable pageable) {

        return service.findAll(
                query,
                pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreatePlatformOrganizationResponse
            create(

                    @RequestBody
                    @Valid
                    CreatePlatformOrganizationRequest request) {

        return service.create(
                request);
    }
}