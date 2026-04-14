import { apiRequest, buildQueryString } from "./client";
import type {
  User, CreateUserPayload, Permission,
  CreatePermissionPayload, AssignPermissionsPayload,
  PaginationParams, HealthResponse,
} from "@/types/api";

const BASE = "/admin-user";

export const adminUserApi = {
  health: () => apiRequest<HealthResponse>(`${BASE}/health`),

  listUsers: (params: PaginationParams = {}) =>
    apiRequest<User[]>(`${BASE}/users${buildQueryString({ skip: params.skip ?? 0, limit: params.limit ?? 20 })}`, { actorAuth: true }),

  createUser: (payload: CreateUserPayload) =>
    apiRequest<User>(`${BASE}/users`, { method: "POST", body: payload, actorAuth: true }),

  getMe: () =>
    apiRequest<User>(`${BASE}/users/me`, { actorAuth: true }),

  assignPermissions: (userId: string, payload: AssignPermissionsPayload) =>
    apiRequest<unknown>(`${BASE}/users/${userId}/permissions`, { method: "POST", body: payload, actorAuth: true }),

  listPermissions: () =>
    apiRequest<Permission[]>(`${BASE}/permissions`, { actorAuth: true }),

  createPermission: (payload: CreatePermissionPayload) =>
    apiRequest<Permission>(`${BASE}/permissions`, { method: "POST", body: payload, actorAuth: true }),
};
