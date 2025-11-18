import api from "./api";

export interface DataRequestOptions {
  reportType: "daily-monthly-active-users" | "reports-by-type" | "top-content";
  dateRange: { from: string; to: string };
  parameters: Record<string, any>;
}

export interface ReportResponse {
  success: boolean;
  data: {
    reportType: string;
    dateRange: { from: string; to: string };
    parameters: Record<string, any>;
    results: any[];
    generatedAt: string;
  };
}

export interface ReportTypesResponse {
  success: boolean;
  data: {
    [key: string]: {
      name: string;
      description: string;
      parameters: Array<{
        name: string;
        type: 'select' | 'multiselect' | 'number' | 'text' | 'checkbox';
        label: string;
        options?: Array<{ value: string; label: string }>;
        default?: any;
        min?: number;
        max?: number;
        placeholder?: string;
        required: boolean;
      }>;
    };
  };
}

export const DataReportsAPI = {
  async generateReport(options: DataRequestOptions): Promise<ReportResponse> {
    const response = await api.post("/data-reports/generate", options);
    return response.data;
  },

  async getReportTypes(): Promise<ReportTypesResponse> {
    const response = await api.get("/data-reports/categories");
    return response.data;
  },
};

export default DataReportsAPI;