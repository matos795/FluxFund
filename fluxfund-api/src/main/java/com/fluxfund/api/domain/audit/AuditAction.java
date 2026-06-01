package com.fluxfund.api.domain.audit;

public enum AuditAction {
    CREATE,
    UPDATE,
    CANCEL,
    CLASSIFY,

    ADD_ALLOCATION,
    UPDATE_ALLOCATION,
    REMOVE_ALLOCATION,

    UPLOAD_ATTACHMENT,
    DELETE_ATTACHMENT,

    ACTIVATE,
    DEACTIVATE,

    CHANGE_DEFAULT_FUND,

    IMPORT_OFX
}