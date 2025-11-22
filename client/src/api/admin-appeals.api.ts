import api from "./api";
import type { UUID } from "@types";

export type AppealEntityType = "user" | "song" | "album" | "playlist";

export type AdminAppeal = {
  appeal_id?: UUID; // user_appeals has this, others use composite keys
  user_id: UUID;
  entity_id?: UUID; // song_id, album_id, playlist_id (not for user appeals)
  submitted_at: string;
  report_type: string;
  reason: string;
  appeal_status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewer_id?: UUID | null;
  
  // Additional fields for display
  username?: string;
  entity_name?: string; // song title, album title, playlist name
  entity_owner?: string; // for content appeals
};

export type AppealDecisionData = {
  appealId?: UUID; // for user appeals
  userId: UUID;
  entityId?: UUID; // for content appeals
  submittedAt: string;
  action: "approve" | "reject";
  reviewerId: UUID;
};

export const AdminAppealsAPI = {
  async getAppeals(entityType: AppealEntityType): Promise<AdminAppeal[]> {
    // Convert singular to plural for API endpoint
    const pluralEntity = entityType === "user" ? "users" 
      : entityType === "song" ? "songs"
      : entityType === "album" ? "albums"
      : "playlists";
    
    const response = await api.get(`/admin/appeals/${pluralEntity}`);
    return response.data.data; // Backend wraps data in { success, data, message }
  },

  async decideAppeal(
    entityType: AppealEntityType,
    appealData: AppealDecisionData
  ) {
    // Convert singular to plural for API endpoint
    const pluralEntity = entityType === "user" ? "users" 
      : entityType === "song" ? "songs"
      : entityType === "album" ? "albums"
      : "playlists";
    
    // Construct appealId based on entity type
    const appealId = entityType === "user" 
      ? appealData.appealId // For user appeals, use appeal_id
      : `${appealData.entityId}-${appealData.userId}`; // For content appeals, use composite key
    
    const response = await api.post(
      `/admin/appeals/${pluralEntity}/${appealId}/decide`,
      {
        decision: appealData.action,
        adminComments: "", // Optional admin comments
        reviewerId: appealData.reviewerId
      }
    );
    return response.data;
  }
};