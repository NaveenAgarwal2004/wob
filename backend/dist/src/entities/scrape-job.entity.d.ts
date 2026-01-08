export declare enum ScrapeJobStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare enum ScrapeTargetType {
    NAVIGATION = "navigation",
    CATEGORY = "category",
    PRODUCT = "product",
    PRODUCT_DETAIL = "product_detail"
}
export declare class ScrapeJob {
    id: string;
    targetUrl: string;
    targetType: ScrapeTargetType;
    status: ScrapeJobStatus;
    startedAt: Date;
    finishedAt: Date;
    errorLog: string;
    createdAt: Date;
    updatedAt: Date;
}
