import { USER_SERVICE_URL } from "@/lib/config";
import { fetchJson } from "@/lib/http";
import type { AdminUserListResponse } from "./types";

export async function fetchAdminUsers(): Promise<AdminUserListResponse> {
  return fetchJson<AdminUserListResponse>(`${USER_SERVICE_URL}/admin/users`);
}
