import api from "./api";
import type { UUID, EntityType } from "@types";

export const userApi = {
  async addToHistory(id: UUID, entityId: UUID, entityType: EntityType) {
    await api.put(`/users/${id}/history`, {
      entityId,
      entityType,
    });
  },

  async toggleLike(id: UUID, entityId: UUID, entityType: EntityType) {
    const response = await api.post(`/users/${id}/likes`, {
      entityId,
      entityType,
    });
    return response.data;
  },

  async checkLikeStatus(id: UUID, entityId: UUID, entityType: EntityType) {
    const response = await api.get(
      `/users/${id}/likes/check?entityType=${entityType}&entityId=${entityId}`
    );
    return response.data;
  },

  async toggleFollowUser(followerId: UUID, followingId: UUID) {
    const response = await api.post(`/users/${followerId}/following`, {
      followingId,
    });
    return response.data;
  },

  async checkFollowStatus(followerId: UUID, followingId: UUID) {
    const response = await api.get(
      `/users/${followerId}/following/check?followingId=${followingId}`
    );
    return response.data;
  },
};
