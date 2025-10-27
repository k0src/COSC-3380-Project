import api from "./api";
import type { UUID, EntityType } from "@types";

export const userApi = {
  async addToHistory(id: UUID, entityId: UUID, entityType: EntityType) {
    await api.put(`/users/${id}/history`, {
      entityId,
      entityType,
    });
  },
};
