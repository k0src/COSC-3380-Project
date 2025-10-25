import api from "./api";
import type { Comment, UUID } from "../types";

export const commentApi = {
  async getCommentsBySongId(
    songId: UUID,
    options?: {
      includeLikes?: boolean;
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
};