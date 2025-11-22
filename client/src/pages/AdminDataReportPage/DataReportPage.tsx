import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataRequestForm, {
  type DataRequestOptions,
} from "./section/DataRequest";
import DataVisualization from "./section/DataVisualization";
import { DataReportsAPI } from "@api/dataReports.api";
import styles from "./DataReport.module.css";

const DataReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateReport(options: DataRequestOptions) {
    try {
      setLoading(true);
      setError(null);
      setData([]);
      setSummary(null);

      console.log("Generating report with options:", options);

      const result = await DataReportsAPI.generateReport(options);
      console.log("API result:", result);

      if (result.success) {
        // Handle different report formats
        const resultsData = result.data.results as any;
        if (Array.isArray(resultsData)) {
          setData(resultsData);
        } else if (
          resultsData?.report_summary_by_name ||
          resultsData?.report_details
        ) {
          // New moderation report format with two tables
          setData([resultsData]); // Wrap in array so DataVisualization gets the full object
          setSummary({ isModeration: true }); // Set a flag so summary section renders
        } else if (resultsData?.reported_entries) {
          // Simplified moderation report: has summary, reported_entries, trends
          setData([resultsData]); // Wrap in array so DataVisualization gets the full object
          setSummary({ isModeration: true }); // Set a flag so summary section renders
        } else if (resultsData?.results) {
          setData(resultsData.results);
          setSummary(resultsData.summary);
        } else {
          setData([]);
        }
      } else {
        // Check if there's a specific error message from the backend
        const errorMessage =
          (result as any).message || "Failed to fetch data report";
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error("Error fetching data report:", err);

      // Extract error message from API response
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "An unexpected error occurred.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className={styles.backButton} onClick={() => navigate("/Admin")}>
        ← Back to Dashboard
      </button>
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          <h2 className={styles.pageTitle}>Admin Data Reports</h2>

          {/* Top Section – Request Form */}
          <DataRequestForm onSubmit={handleGenerateReport} />

          {/* Bottom Section – Data Table */}
          <DataVisualization
            data={data}
            loading={loading}
            error={error}
            summary={summary}
          />
        </div>
      </main>
    </>
  );
};

export default DataReportPage;
