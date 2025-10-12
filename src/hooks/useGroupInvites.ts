import { useState, useCallback, useEffect } from "react";
import {
  createInviteCode,
  getInviteCodes,
  revokeInviteCode,
} from "@/lib/api/organization";
import type { InviteCode, CreateInviteCodeRequest } from "@/interfaces";

interface UseGroupInvitesReturn {
  invites: InviteCode[];
  isLoading: boolean;
  error: Error | null;
  createInvite: (data?: CreateInviteCodeRequest) => Promise<InviteCode>;
  revokeInvite: (inviteCode: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useGroupInvites(
  organizationId: string | null
): UseGroupInvitesReturn {
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!organizationId) {
      setInvites([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getInviteCodes(organizationId);
      setInvites(response.invites);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      setInvites([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreateInvite = useCallback(
    async (data?: CreateInviteCodeRequest): Promise<InviteCode> => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await createInviteCode(organizationId, data);
        await fetchInvites(); // Refresh the list
        return response.invite;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, fetchInvites]
  );

  const handleRevokeInvite = useCallback(
    async (inviteCode: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await revokeInviteCode(inviteCode);
        await fetchInvites(); // Refresh the list
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvites]
  );

  return {
    invites,
    isLoading,
    error,
    createInvite: handleCreateInvite,
    revokeInvite: handleRevokeInvite,
    refetch: fetchInvites,
  };
}
