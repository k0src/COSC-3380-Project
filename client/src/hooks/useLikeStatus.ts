import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@api";
import type { EntityType } from "@types";

export interface LikeStatusProps {
  userId: string;
  entityId: string;
  entityType: EntityType;
  isAuthenticated: boolean;
}

export function useLikeStatus({
  userId,
  entityId,
  entityType,
  isAuthenticated,
}: LikeStatusProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["likeStatus", userId, entityId, entityType],
    queryFn: async () => {
      const response = await userApi.checkLikeStatus(
        userId,
        entityId,
        entityType
      );
      return response.isLiked;
    },
    enabled: !!userId && !!entityId && isAuthenticated,
    refetchOnMount: true,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      return await userApi.toggleLike(userId, entityId, entityType);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["likeStatus", userId, entityId, entityType],
      });
      const previousStatus = queryClient.getQueryData<boolean>([
        "likeStatus",
        userId,
        entityId,
        entityType,
      ]);
      queryClient.setQueryData<boolean>(
        ["likeStatus", userId, entityId, entityType],
        (oldStatus) => !oldStatus
      );
      return { previousStatus };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData<boolean>(
          ["likeStatus", userId, entityId, entityType],
          context.previousStatus
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["likeStatus", userId, entityId, entityType],
      });
    },
  });

  return {
    isLiked: data,
    isLoading,
    error,
    toggleLike: toggleLikeMutation.mutateAsync,
  };
}
