from app.models.enums import ReportStatus, UserRole

VALID_TRANSITIONS = {
    ReportStatus.SUBMITTED: [ReportStatus.AI_PROCESSING, ReportStatus.CANCELLED],
    ReportStatus.AI_PROCESSING: [
        ReportStatus.CLASSIFIED,
        ReportStatus.PENDING_REVIEW,
        ReportStatus.AI_FAILED,
    ],
    ReportStatus.AI_FAILED: [ReportStatus.PENDING_REVIEW, ReportStatus.AI_PROCESSING],
    ReportStatus.CLASSIFIED: [
        ReportStatus.ACKNOWLEDGED,
        ReportStatus.REJECTED,
        ReportStatus.DUPLICATE,
    ],
    ReportStatus.PENDING_REVIEW: [
        ReportStatus.ACKNOWLEDGED,
        ReportStatus.REJECTED,
        ReportStatus.DUPLICATE,
    ],
    ReportStatus.ACKNOWLEDGED: [ReportStatus.ASSIGNED, ReportStatus.REJECTED],
    ReportStatus.ASSIGNED: [ReportStatus.IN_PROGRESS, ReportStatus.ACKNOWLEDGED],
    ReportStatus.IN_PROGRESS: [ReportStatus.RESOLVED, ReportStatus.ASSIGNED],
    ReportStatus.RESOLVED: [ReportStatus.VERIFIED, ReportStatus.IN_PROGRESS],
    ReportStatus.VERIFIED: [ReportStatus.CLOSED],
}

ROLE_TRANSITIONS = {
    UserRole.CITIZEN: {ReportStatus.SUBMITTED: [ReportStatus.CANCELLED]},
    UserRole.WORKER: {
        ReportStatus.ASSIGNED: [ReportStatus.IN_PROGRESS],
        ReportStatus.IN_PROGRESS: [ReportStatus.RESOLVED],
    },
    UserRole.OPERATOR: {
        ReportStatus.CLASSIFIED: [
            ReportStatus.ACKNOWLEDGED,
            ReportStatus.REJECTED,
            ReportStatus.DUPLICATE,
        ],
        ReportStatus.PENDING_REVIEW: [
            ReportStatus.ACKNOWLEDGED,
            ReportStatus.REJECTED,
            ReportStatus.DUPLICATE,
        ],
        ReportStatus.AI_FAILED: [ReportStatus.PENDING_REVIEW],
        ReportStatus.ACKNOWLEDGED: [ReportStatus.ASSIGNED, ReportStatus.REJECTED],
        ReportStatus.ASSIGNED: [ReportStatus.IN_PROGRESS, ReportStatus.ACKNOWLEDGED],
        ReportStatus.IN_PROGRESS: [ReportStatus.RESOLVED],
        ReportStatus.RESOLVED: [ReportStatus.VERIFIED, ReportStatus.IN_PROGRESS],
        ReportStatus.VERIFIED: [ReportStatus.CLOSED],
    },
}

ROLE_TRANSITIONS[UserRole.ADMIN] = ROLE_TRANSITIONS[UserRole.OPERATOR]
