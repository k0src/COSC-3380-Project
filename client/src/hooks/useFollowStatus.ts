import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@api";

export interface FollowStatusProps {
  userId: string;
  followingUserId: string;
  isAuthenticated: boolean;
}

export function useFollowStatus({
  userId,
  followingUserId,
  isAuthenticated,
}: FollowStatusProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["followStatus", userId, followingUserId],
    queryFn: async () => {
      const response = await userApi.checkFollowStatus(userId, followingUserId);
      return response.isFollowing;
    },
    enabled: !!userId && !!followingUserId && isAuthenticated,
    refetchOnMount: true,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      return await userApi.toggleFollowUser(userId, followingUserId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["followStatus", userId, followingUserId],
      });
      const previousStatus = queryClient.getQueryData<boolean>([
        "followStatus",
        userId,
        followingUserId,
      ]);
      queryClient.setQueryData<boolean>(
        ["followStatus", userId, followingUserId],
        (oldStatus) => !oldStatus
      );
      return { previousStatus };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData<boolean>(
          ["followStatus", userId, followingUserId],
          context.previousStatus
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["followStatus", userId, followingUserId],
      });
    },
  });

  return {
    isFollowed: data,
    isLoading,
    error,
    toggleFollow: toggleFollowMutation.mutateAsync,
  };
}
