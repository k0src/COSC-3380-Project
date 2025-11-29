import api from "./api";
import type {
  UUID,
  ReportableEntityType,
  ReportType,
  OrderByDirection,
  ReportOrderByColumn,
  AppealOrderByColumn,
  Report,
  Appeal,
} from "@types";

export const reportApi = {
  async getReports(options?: {
    orderByColumn?: ReportOrderByColumn;
    orderByDirection?: OrderByDirection;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await api.get<Report[]>(`/report`, {
        params: options,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getAppeals(options?: {
    orderByColumn?: AppealOrderByColumn;
    orderByDirection?: OrderByDirection;
    limit?: number;
    offset?: number;
  }) {
    try {
      const response = await api.get<Appeal[]>(`/report/appeal`, {
        params: options,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async getAppealsForEntity(
    entityType: ReportableEntityType,
    entityId: UUID,
    options?: {
      orderByColumn?: AppealOrderByColumn;
      orderByDirection?: OrderByDirection;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const response = await api.get<Appeal[]>(`/report/appeal/${entityType}`, {
        params: { entityId, ...options },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  async submitReport(
    entityType: ReportableEntityType,
    data: {
      reporter_id: UUID;
      reported_id: UUID;
      report_type: ReportType;
      description: string;
    }
  ) {
    const response = await api.post(`/report/${entityType}`, data);
    return response.data;
  },

  async submitAppeal(
    entityType: ReportableEntityType,
    userId: UUID,
    reason: string,
    entityId?: UUID
  ) {
    const response = await api.post(`/report/appeal/${entityType}`, {
      userId,
      entityId,
      reason,
    });
    return response.data;
  },

  async checkPendingAppeal(
    entityType: ReportableEntityType,
    userId: UUID,
    entityId?: UUID
  ) {
    const response = await api.get<{ hasPendingAppeal: boolean }>(
      `/report/appeal/${entityType}/check`,
      {
        params: {
          userId,
          entityId,
        },
      }
    );
    return response.data;
  },

  async resolveReport(
    reportId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID,
    entityId: UUID
  ) {
    const response = await api.post(`/report/${reportId}/resolve`, {
      entityType,
      reviewerId,
      entityId,
    });
    return response.data;
  },

  async dismissReport(
    reportId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID,
    entityId: UUID
  ) {
    const response = await api.post(`/report/${reportId}/dismiss`, {
      entityType,
      reviewerId,
      entityId,
    });
    return response.data;
  },

  async resolveAppeal(
    appealId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID,
    entityId: UUID
  ) {
    const response = await api.post(`/report/appeal/${appealId}/resolve`, {
      entityType,
      reviewerId,
      entityId,
    });
    return response.data;
  },

  async dismissAppeal(
    appealId: UUID,
    entityType: ReportableEntityType,
    reviewerId: UUID
  ) {
    const response = await api.post(`/report/appeal/${appealId}/dismiss`, {
      entityType,
      reviewerId,
    });
    return response.data;
  },
};
