"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminUsers } from "./api";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });
}
