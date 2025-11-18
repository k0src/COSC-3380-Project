import { AdminRepository } from "@repositories";
import type { UUID } from "types";

// Add the missing type definition (or import if you already have it elsewhere)
export type ReportEntity = "user" | "song" | "album" | "playlist";

export class AdminReportService {
  static async getReports(
    entity: ReportEntity,
    options?: { limits?: number; offset?: number }
  ) {
    return AdminRepository.getReports(entity, options?.limits, options?.offset);
  }

  static async decideReport(
    entity: ReportEntity, // Add entity type argument (required by repository)
    reportId: UUID,
    result: "suspend" | "reject",
    adminId: UUID
  ) {
    // Pass all four arguments in correct order
    return AdminRepository.updateReportDecision(entity, reportId, result, adminId);
  }
}

export default AdminReportService;