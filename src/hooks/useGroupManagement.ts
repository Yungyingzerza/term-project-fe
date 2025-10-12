import { useState, useCallback } from "react";
import {
  createGroup,
  updateGroup,
  leaveGroup,
  joinGroupWithInvite,
} from "@/lib/api/organization";
import type {
  Organization,
  CreateGroupRequest,
  UpdateGroupRequest,
} from "@/interfaces";

interface UseGroupManagementReturn {
  createGroup: (data: CreateGroupRequest) => Promise<Organization>;
  updateGroup: (
    organizationId: string,
    data: UpdateGroupRequest
  ) => Promise<Organization>;
  leaveGroup: (organizationId: string) => Promise<void>;
  joinGroup: (inviteCode: string) => Promise<Organization>;
  isLoading: boolean;
  error: Error | null;
}

export function useGroupManagement(): UseGroupManagementReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCreateGroup = useCallback(
    async (data: CreateGroupRequest): Promise<Organization> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await createGroup(data);
        return response.organization;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleUpdateGroup = useCallback(
    async (
      organizationId: string,
      data: UpdateGroupRequest
    ): Promise<Organization> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await updateGroup(organizationId, data);
        return response.organization;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleLeaveGroup = useCallback(
    async (organizationId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await leaveGroup(organizationId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleJoinGroup = useCallback(
    async (inviteCode: string): Promise<Organization> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await joinGroupWithInvite(inviteCode);
        return response.organization;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    createGroup: handleCreateGroup,
    updateGroup: handleUpdateGroup,
    leaveGroup: handleLeaveGroup,
    joinGroup: handleJoinGroup,
    isLoading,
    error,
  };
}
