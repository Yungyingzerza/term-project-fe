import { useState, useCallback, useEffect } from "react";
import { getGroupMembers, removeMember } from "@/lib/api/organization";
import type { GroupMember } from "@/interfaces";

interface UseGroupMembersReturn {
  members: GroupMember[];
  isLoading: boolean;
  error: Error | null;
  removeMember: (userId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useGroupMembers(
  organizationId: string | null
): UseGroupMembersReturn {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getGroupMembers(organizationId);
      setMembers(response.members);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRemoveMember = useCallback(
    async (userId: string): Promise<void> => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }

      setIsLoading(true);
      setError(null);
      try {
        await removeMember(organizationId, userId);
        await fetchMembers(); // Refresh the list
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, fetchMembers]
  );

  return {
    members,
    isLoading,
    error,
    removeMember: handleRemoveMember,
    refetch: fetchMembers,
  };
}
