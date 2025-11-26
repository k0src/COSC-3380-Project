import api from "./api";
import type {
  AccessContext,
  Comment,
  CommentOrderByColumn,
  OrderByDirection,
  UUID,
} from "@types";

export const commentApi = {
  async getCommentsBySongId(
    songId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: CommentOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Comment[]>(`/songs/${songId}/comments`, {
        params: {
          ...options,
          role: accessContext.role,
          userId: accessContext.userId,
          scope: accessContext.scope,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getCommentsByArtistId(
    artistId: UUID,
    accessContext: AccessContext,
    options?: {
      orderByColumn?: CommentOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Comment[]>(
        `/comments/artists/${artistId}`,
        {
          params: {
            ...options,
            role: accessContext.role,
            userId: accessContext.userId,
            scope: accessContext.scope,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async add(userId: UUID, songId: UUID, commentText: string) {
    const response = await api.post<{ id: UUID }>(`/songs/${songId}/comments`, {
      userId,
      commentText,
    });
    return response.data;
  },

  async delete(commentId: UUID) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  async bulkDelete(commentIds: UUID[]) {
    const response = await api.post(`/comments/bulk-delete`, { commentIds });
    return response.data;
  },
};
