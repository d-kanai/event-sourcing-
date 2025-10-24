export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: "PENDING_VERIFICATION" | "VERIFIED";
  createdAt: string;
}

export interface AdminUserListResponse {
  users: AdminUser[];
}
