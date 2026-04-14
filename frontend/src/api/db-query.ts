import { apiRequest, buildQueryString } from "./client";
import type { DbQueryParams, DbTable, HealthResponse } from "@/types/api";

type ServiceSlug = "leave-requests" | "onboarding" | "punch-in-out" | "salary-management";

function makeDbApi(slug: ServiceSlug) {
  const base = `/${slug}`;
  return {
    health: () => apiRequest<HealthResponse>(`${base}/health`),
    dbHealth: () => apiRequest<HealthResponse>(`${base}/db/health`),
    tables: () => apiRequest<DbTable[]>(`${base}/db/tables`),
    query: (params: DbQueryParams) => {
      const { table, filters, ...rest } = params;
      const qs = buildQueryString({ table, ...rest, filters });
      return apiRequest<any[]>(`${base}/db/query${qs}`);
    },
    getRecord: (table: string, recordId: string, idColumn = "id") =>
      apiRequest<any>(`${base}/db/query/${table}/${recordId}${buildQueryString({ id_column: idColumn })}`),
  };
}

export const leaveApi = makeDbApi("leave-requests");
export const onboardingApi = makeDbApi("onboarding");
export const punchApi = makeDbApi("punch-in-out");
export const salaryApi = makeDbApi("salary-management");
