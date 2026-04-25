export interface LogEntry {
    traceId: string;
    sessionId?: string;
    userId?: string;
    method: string;
    path: string;
    statusCode: number;
    latencyMs: number;
    provider?: string;
    model?: string;
    useRag?: boolean;
    ragHitRate?: number;
    errorCode?: string;
    errorMessage?: string;
    error?: string;
}
export interface LogFilters {
    userId?: string;
    sessionId?: string;
    provider?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
