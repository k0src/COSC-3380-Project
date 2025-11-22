import api from "./api";
import type { UUID } from "@types";

export type CreateAppealData = {
  appealerId: UUID;
  appealedEntityId: UUID;
  appealedEntityType: "SONG" | "ALBUM" | "PLAYLIST" | "USER";
  appealType: "CONTENT_HIDDEN" | "ACCOUNT_SUSPENSION";
  reason: string;
  description: string;
};

export type AppealResponse = {
  appeal_id: UUID;
  appealer_id: UUID;
  appealed_entity_id: UUID;
  appeal_type: string;
  appeal_reason: string;
  description: string;
  appeal_status: "PENDING" | "APPROVED" | "DENIED";
  appealed_at: string;
  reviewer_id?: UUID | null;
  reviewed_at?: string | null;
};

export const appealsApi = {
  async createAppeal(data: CreateAppealData) {
    const response = await api.post("/appeals", data);
    return response.data;
  },

  async getUserAppeals(userId: UUID) {
    const response = await api.get(`/appeals/user/${userId}`);
    return response.data;
  },

  async getAppealStatus(appealId: UUID) {
    const response = await api.get(`/appeals/${appealId}`);
    return response.data;
  },
};
