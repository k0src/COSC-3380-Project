import api from "./api";
import type { Comment, UUID } from "@types";

export const commentApi = {
  async getCommentsBySongId(
    songId: UUID,
    options?: {
      currentUserId?: UUID;
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Comment[]>(`/songs/${songId}/comments`, {
      params: options,
    });
    return response.data;
  },

  async addComment(userId: UUID, songId: UUID, commentText: string) {
    const response = await api.post<{ id: UUID }>(`/songs/${songId}/comments`, {
      userId,
      commentText,
    });
    return response.data;
  },

  async deleteComment(commentId: UUID) {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  async bulkDeleteComments(commentIds: UUID[]) {
    const response = await api.post(`/comments/bulk-delete`, { commentIds });
    return response.data;
  },

  async getCommentsByArtistId(
    artistId: UUID,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const response = await api.get<Comment[]>(`/comments/artists/${artistId}`, {
      params: options,
    });
    return response.data;
  },
};
