"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchUserOrganizations,
  resetOrganizations,
} from "@/store/organizationsSlice";

interface UseUserOrganizationsOptions {
  enabled?: boolean;
}

export function useUserOrganizations(options?: UseUserOrganizationsOptions) {
  const enabled = options?.enabled ?? true;
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.organizations);
  const userId = useAppSelector((s) => s.user.id);

  useEffect(() => {
    if (!enabled) return;

    if (!userId) {
      if (status !== "idle" || items.length > 0 || error) {
        dispatch(resetOrganizations());
      }
      return;
    }

    if (status === "idle") {
      void dispatch(fetchUserOrganizations());
    }
  }, [
    dispatch,
    enabled,
    userId,
    status,
    items.length,
    error,
  ]);

  const refetch = useCallback(() => {
    if (!userId) return Promise.resolve();
    return dispatch(fetchUserOrganizations()).unwrap().catch(() => undefined);
  }, [dispatch, userId]);

  return {
    organizations: items,
    status,
    error,
    refetch,
  };
}
