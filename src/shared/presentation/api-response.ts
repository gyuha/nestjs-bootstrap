export const createApiResponse = <TData>(
  data: TData,
  meta?: { traceId?: string },
) => ({
  success: true,
  data,
  meta,
});
