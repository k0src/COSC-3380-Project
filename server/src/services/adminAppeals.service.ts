import AdminAppealsRepository from "@repositories/adminAppeals.repo";
import type { UUID } from "types";
import type { AppealEntity, AdminAppealData } from "@repositories/adminAppeals.repo";

export class AdminAppealsService {
  static async getAppeals(
    entity: AppealEntity,
    options?: { limit?: number; offset?: number }
  ): Promise<AdminAppealData[]> {
    return AdminAppealsRepository.getAppeals(
      entity,
      options?.limit || 50,
      options?.offset || 0
    );
  }

  static async decideAppeal(
    entity: AppealEntity,
    appealData: {
      appealId?: UUID;
      userId: UUID;
      entityId?: UUID;
      submittedAt: string;
      action: "approve" | "reject";
      reviewerId: UUID;
    }
  ) {
    return AdminAppealsRepository.updateAppealDecision(entity, appealData);
  }
}

export default AdminAppealsService;