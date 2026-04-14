// ── Admin User Service Types ──
export interface User {
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  is_admin: boolean;
  permission_names?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  password_hash: string;
  status?: string;
  is_admin?: boolean;
  permission_names?: string[];
}

export interface Permission {
  permission_id?: string;
  name: string;
  description: string | null;
}

export interface CreatePermissionPayload {
  name: string;
  description?: string | null;
}

export interface AssignPermissionsPayload {
  permission_names: string[];
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

// ── DB Query Service Types ──
export interface DbQueryParams {
  table: string;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: "asc" | "desc";
  filters?: Record<string, string>;
}

export interface DbTable {
  table_name: string;
  [key: string]: unknown;
}

// ── API Response Types ──
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

// ── Auth Types ──
export type DemoRole = "admin" | "employee";

export interface DemoAccount {
  role: DemoRole;
  email: string;
  label: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "admin", email: "admin@hr.local", label: "Admin Demo" },
  { role: "employee", email: "hr.executive@hr.local", label: "Employee Demo" },
];
